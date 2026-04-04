# Plan: Incremental Season Fetching on Refresh

## Context

Currently, both ONBOARD and REFRESH requests call `fetch_all()`, which fetches data across **all historical seasons** for a league. This is wasteful on REFRESH because historical data is immutable. Only the **current season's data** needs to be re-fetched. The goal is to scope refresh fetches to the current season only, while ensuring aggregate views (e.g., TEAMS across all seasons) remain correct.

---

## Architecture Overview (Relevant Parts)

| File | Role |
|------|------|
| `src/onboarder/onboarding_service.py` | Orchestrates fetch; calls `fetch_all()`, then writes status to DynamoDB and uploads raw data to S3 |
| `src/onboarder/writer.py` | `upload_results_to_s3()` uploads a single `onboard.json` containing all seasons |
| `src/onboarder/espn_client.py` | Discovers all seasons, builds all request URLs, fetches asynchronously |
| `src/onboarder/sleeper_client.py` | Walks `previous_league_id` chain to discover all seasons, fetches async |
| `src/processor/handler.py` | S3 trigger; reads `onboard.json`, calls `Transformer`, calls `DynamoWriter` |
| `src/processor/transformer.py` | DuckDB-based SQL transformation; takes `raw_data` list, returns `{sort_key: data}` dict |
| `src/processor/dynamo_writer.py` | `write_all()` does `put_item` for each view, then updates METADATA status |
| `infrastructure/modules/s3/main.tf` | S3 notification fires processor Lambda on `s3:ObjectCreated:*` with prefix `raw-api-data/` |

**Current S3 layout:**
```
raw-api-data/{platform}/{canonical_league_id}/onboard.json   ← single file, all seasons
```

**Current refresh detection:** `has_prior_versions()` on `onboard.json` — if it already has versions, this is a refresh.

---

## Solution Options

### Option A: Pass `is_refresh` flag to clients — limit season discovery *(Simplest)*

Add `is_refresh: bool = False` to `ESPNClient` and `SleeperClient`. When `True`:
- **ESPN:** Skip `_get_league_seasons()`, set `self.seasons = [latest_season]`
- **Sleeper:** Stop the `previous_league_id` walk after the first (current) season

Files changed: `onboarding_service.py` (3 lines), `espn_client.py` (~5 lines), `sleeper_client.py` (~3 lines)

**Limitation:** The processor still re-processes ALL data from `onboard.json` (only the fetch is faster, not the transform or DynamoDB write). Historical data is refetched because it's stored in one file. Doesn't address re-write of historical seasons to DynamoDB.

---

### Option B: Compare stored seasons, fetch only new/current *(More robust fetch)*

On REFRESH, read `LEAGUE_LOOKUP.seasons` from DynamoDB; pass as exclusion list to clients. Clients compute `seasons_to_fetch = discovered_seasons - known_seasons + [current_season]`.

**Same limitation as Option A** for the processor side.

---

### Option C: Per-season S3 storage with manifest trigger *(Recommended — truly incremental)*

**Core idea:** Split `onboard.json` into per-season files. Add a `manifest.json` as the S3 notification trigger. On REFRESH, only the current season's file is overwritten. The processor reads all season files and merges before transforming — ensuring cross-season views (TEAMS) always reflect complete history.

---

## Option C — Detailed Design

### New S3 Layout

```
raw-api-data/{platform}/{canonical_league_id}/2022.json
raw-api-data/{platform}/{canonical_league_id}/2023.json
raw-api-data/{platform}/{canonical_league_id}/2024.json
raw-api-data/{platform}/{canonical_league_id}/manifest.json   ← S3 trigger target
```

`manifest.json` contains the list of seasons present: `["2022", "2023", "2024"]`

`{season}.json` contains the same format as today's `onboard.json`, filtered to that season:
```json
[
  {"season": "2024", "data_type": "users", "data": {...}},
  {"season": "2024", "data_type": "matchups_week1", "data": {...}},
  ...
]
```

### Why a manifest file as the trigger?

Without a manifest trigger, writing N season files on initial onboard fires the processor N times. Each firing would try to read all season files — but season files for other seasons may not yet be written (race condition). The manifest is written **last**, after all season files are in place, so the processor only fires once and sees a consistent set of files.

### On ONBOARD

1. **Onboarder** fetches ALL seasons (no change to clients)
2. **`writer.py`** splits results by season → writes `{season}.json` for each season
3. **`writer.py`** writes `manifest.json` last with the full seasons list
4. **Processor** fires on `manifest.json` creation, reads manifest, reads all `{season}.json` files, merges → transform → write all views to DynamoDB

### On REFRESH

1. **Onboarder** fetches ONLY the current season (apply Option A flag to clients)
2. **`writer.py`** overwrites `{current_season}.json` with fresh data
3. **`writer.py`** overwrites `manifest.json` (same seasons list — triggers processor, also creates new version for refresh detection)
4. **Processor** fires on `manifest.json` new version, reads manifest, reads ALL `{season}.json` files (historical ones are unchanged), merges → transform → write all views to DynamoDB (puts complete, up-to-date data)

### Refresh Detection

`has_prior_versions()` is called on `manifest.json` (instead of `onboard.json`). Same logic: if `manifest.json` already has versions → refresh.

---

## Changes Required

### 1. `src/onboarder/espn_client.py` and `src/onboarder/sleeper_client.py`
Add `is_refresh: bool = False` param. On refresh:
- ESPN: `self.seasons = [latest_season]` (skip `_get_league_seasons()`)
- Sleeper: stop the `previous_league_id` walk after the first result

### 2. `src/onboarder/onboarding_service.py`
- Pass `is_refresh=(request_type == "REFRESH")` to `_build_client()`
- Pass current season info to writer so it knows which `{season}.json` to (over)write

### 3. `src/onboarder/writer.py`
Replace `upload_results_to_s3()` with logic that:
- Groups `raw_data` results by `season`
- Writes each group to `raw-api-data/{platform}/{canonical_league_id}/{season}.json`
- Writes `manifest.json` last: `{"seasons": ["2022", "2023", "2024"]}`

On REFRESH, only the current season file changes; manifest is still rewritten (triggers processor, creates new version for refresh detection). Historical `{season}.json` files are untouched.

### 4. `src/processor/handler.py`
- Parse key as `raw-api-data/{platform}/{canonical_league_id}/manifest.json`
- Read `manifest.json` to get the seasons list
- For each season in the manifest, read `raw-api-data/{platform}/{canonical_league_id}/{season}.json`
- Merge all results into a single `raw_data` list
- Pass merged list to `Transformer` (no changes needed to transformer)
- `has_prior_versions()` called on `manifest.json` key (same logic, new key)

### 5. `infrastructure/modules/s3/main.tf`
Add suffix filter `manifest.json` to the S3 bucket notification so the processor Lambda only fires when `manifest.json` is written, not on every `{season}.json` upload.

### No Changes Needed
- `src/processor/transformer.py` — receives same `raw_data` format, no change
- `src/processor/queries.py` — no change
- `src/processor/dynamo_writer.py` — `write_all()` already does full `put_item` overwrites; correct behavior is maintained since merged data is complete

---

## Verification

1. **Onboard:** Trigger ONBOARD; check S3 contains per-season files + manifest; check DynamoDB TEAMS has rows for all seasons
2. **Refresh:** Trigger REFRESH for current season; check only current season S3 file is updated (historical season files unchanged); check DynamoDB TEAMS still has all historical rows plus updated current season rows
3. **S3 trigger:** Confirm processor Lambda fires exactly once on onboard (on manifest write, not on each season file)
