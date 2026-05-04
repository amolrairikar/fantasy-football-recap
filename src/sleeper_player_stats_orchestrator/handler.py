import json
import os
import boto3
from utils import build_retry_session, logger

s3_client = boto3.client("s3")
sqs_client = boto3.client("sqs")
http_session = build_retry_session()

SLEEPER_NFL_STATE_URL = "https://api.sleeper.app/v1/state/nfl"
PLAYER_METADATA_S3_KEY = "player-metadata/sleeper_nfl_players.json"


def fetch_nfl_state() -> dict | None:
    try:
        response = http_session.get(SLEEPER_NFL_STATE_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.warning("Failed to fetch NFL state: %s", e)
        return None


def lambda_handler(event, context) -> None:
    logger.info("Event data: %s", event)
    bucket = os.environ["S3_BUCKET_NAME"]
    queue_url = os.environ["SQS_QUEUE_URL"]
    nfl_state = fetch_nfl_state()
    if not nfl_state:
        logger.error("Could not fetch NFL state — aborting.")
        raise RuntimeError("Failed to fetch NFL state")
    if nfl_state.get("season_type") == "off":
        logger.info("NFL season is off — skipping player stats refresh.")
        return

    season = nfl_state["season"]
    response = s3_client.get_object(Bucket=bucket, Key=PLAYER_METADATA_S3_KEY)
    players = json.loads(response["Body"].read())

    active_ids = [
        pid for pid, meta in players.items() if meta.get("status") == "Active"
    ]
    logger.info("Found %d active players; season=%s", len(active_ids), season)

    entries = []
    total = 0
    for player_id in active_ids:
        entries.append(
            {
                "Id": str(len(entries)),
                "MessageBody": json.dumps({"player_id": player_id, "season": season}),
            }
        )
        total += 1
        if len(entries) == 10:
            sqs_client.send_message_batch(QueueUrl=queue_url, Entries=entries)
            entries = []
    if entries:
        sqs_client.send_message_batch(QueueUrl=queue_url, Entries=entries)

    logger.info("Enqueued %d messages to SQS", total)
