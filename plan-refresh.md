# Plan: Selective Season Processing for Refreshes

## Context

Currently, the processor Lambda (`src/processor/handler.py`) always processes **all seasons** listed in the manifest, even on a refresh when only the latest season's data has changed. This is inefficient.

The onboarder already limits API fetches to the latest season on a refresh, but the processor re-reads and recomputes DynamoDB items for every season in the manifest. The goal is to make the processor smarter: compare the current and previous manifest versions to determine exactly which season(s) need reprocessing.

**Rules:**
- **New season added** (current manifest has a season not in the previous manifest): process only that new season.
- **Same seasons in both manifests** (in-season refresh, e.g., week 10 → week 12 scores updated): process only the last (most recent) season.
- **No prior manifest version** (initial onboard): process all seasons (unchanged behavior).

---

## Critical Files

- `src/processor/handler.py` — all changes are here

---

## Implementation Plan

### Step 1: Refactor `has_prior_versions` → `get_previous_version_id`

Replace the existing `has_prior_versions` helper with a new one that returns the previous version's `VersionId` (or `None` if no prior version exists).

```python
def get_previous_version_id(bucket: str, key: str) -> str | None:
    """
    Returns the VersionId of the second-most-recent version of an S3 object,
    or None if no prior version exists.
    """
    try:
        response = s3_client.list_object_versions(Bucket=bucket, Prefix=key)
        versions = [v for v in response.get("Versions", []) if v["Key"] == key]
        # Sort newest first
        versions.sort(key=lambda v: v["LastModified"], reverse=True)
        if len(versions) > 1:
            return versions[1]["VersionId"]
        return None
    except Exception as e:
        logger.error(f"Error fetching version history for {key}: {e}")
        return None
```

### Step 2: Update `read_s3_object` to accept an optional `version_id`

Add an optional `version_id` parameter so the previous manifest version can be fetched:

```python
def read_s3_object(bucket: str, key: str, version_id: str | None = None) -> Any:
    kwargs = {"Bucket": bucket, "Key": key}
    if version_id:
        kwargs["VersionId"] = version_id
    try:
        response = s3_client.get_object(**kwargs)
        ...
```

### Step 3: Add `resolve_seasons_to_process` helper

New pure function that encapsulates the season-selection logic:

```python
def resolve_seasons_to_process(
    current_seasons: list[str],
    previous_seasons: list[str] | None,
) -> list[str]:
    """
    Determines which seasons the processor should recompute.

    - No previous manifest (initial onboard): all seasons.
    - New season detected: only the new season(s).
    - Same seasons (in-season refresh): only the last season.
    """
    if previous_seasons is None:
        return current_seasons
    new_seasons = sorted(set(current_seasons) - set(previous_seasons))
    if new_seasons:
        return new_seasons
    return [current_seasons[-1]]
```

### Step 4: Update `lambda_handler`

Replace the `has_prior_versions` call and the unconditional `seasons = manifest[platform]` with the new logic:

```python
previous_version_id = get_previous_version_id(bucket=bucket, key=key)

manifest = read_s3_object(bucket=bucket, key=key)
platform = next(iter(manifest))
all_seasons = manifest[platform]
prefix = "/".join(key.split("/")[:2])

previous_seasons = None
if previous_version_id:
    previous_manifest = read_s3_object(bucket=bucket, key=key, version_id=previous_version_id)
    previous_seasons = previous_manifest.get(platform, [])

seasons_to_process = resolve_seasons_to_process(
    current_seasons=all_seasons,
    previous_seasons=previous_seasons,
)
logger.info("Seasons to process: %s (all seasons in manifest: %s)", seasons_to_process, all_seasons)
```

Then use `seasons_to_process` in the `ThreadPoolExecutor` instead of `seasons`.

The DuckDB views (`register_raw_data`) should still be built from **all seasons' raw data** so that cross-season queries (e.g., standings) have full context — but the DynamoDB writes should only write items for the processed seasons. Wait — actually, looking at the QUERIES and how DynamoDB items are keyed by season, if we only load data for the season(s) to process we will overwrite only those DynamoDB items, which is exactly what we want. So `raw_data` should only be loaded for `seasons_to_process`.

**Final approach:** Load raw data only for `seasons_to_process` (not all seasons). The DuckDB views will contain only the relevant season(s), and DynamoDB writes will only update those season's items. Historical seasons already have correct data in DynamoDB from the original onboard.

The `is_refresh` / `prior_versions_exist` flag that was passed to `write_metadata_items` is replaced by `previous_version_id is not None`.

### Step 5: Remove the now-unused `has_prior_versions` function

---

## Data Flow After Change

```
manifest.json updated → processor triggered
  → get_previous_version_id()  →  None (first time) | VersionId (refresh)
  → read current manifest       →  {platform: [all seasons]}
  → read previous manifest      →  {platform: [prior seasons]} | None
  → resolve_seasons_to_process  →  [seasons to write to DynamoDB]
  → load raw data only for those seasons
  → run queries + write DynamoDB items for those seasons only
  → write_metadata_items(refresh = previous_version_id is not None)
```

---

## Verification

1. **Unit tests** — update `tests/unit/processor/test_handler.py`:
   - Test `get_previous_version_id`: no versions → None; 1 version → None; 2+ versions → correct VersionId.
   - Test `resolve_seasons_to_process`: all three branches (initial, new season, same seasons).
   - Test `read_s3_object` with and without `version_id`.
   - Test `lambda_handler` mock: verify `ThreadPoolExecutor` is only called for `seasons_to_process`, not all seasons.

2. **Run existing tests** to confirm no regressions:
   ```
   pytest tests/unit/processor/
   ```
