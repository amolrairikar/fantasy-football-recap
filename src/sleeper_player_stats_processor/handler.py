import json
import os
import time
import boto3
from utils import build_retry_session, logger

s3_client = boto3.client("s3")
sqs_client = boto3.client("sqs")
http_session = build_retry_session()

SLEEPER_STATS_URL = "https://api.sleeper.com/stats/nfl/player/{player_id}?season_type=regular&season={season}"
MIN_REQUEST_INTERVAL = 0.6
STAGING_COMPLETE_KEY = "player-stats/staging/complete.json"


def fetch_stats(player_id: str, season: str) -> dict | None:
    url = SLEEPER_STATS_URL.format(player_id=player_id, season=season)
    t_start = time.monotonic()
    try:
        response = http_session.get(url, timeout=10)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        data = response.json()
        return data.get("stats") if isinstance(data, dict) else None
    finally:
        remaining = MIN_REQUEST_INTERVAL - (time.monotonic() - t_start)
        if remaining > 0:
            time.sleep(remaining)


def is_queue_drained(queue_url: str) -> bool:
    attrs = sqs_client.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=[
            "ApproximateNumberOfMessages",
            "ApproximateNumberOfMessagesNotVisible",
        ],
    )
    visible = int(attrs["Attributes"]["ApproximateNumberOfMessages"])
    in_flight = int(attrs["Attributes"]["ApproximateNumberOfMessagesNotVisible"])
    return visible == 0 and in_flight == 1


def complete_sentinel_exists(bucket: str) -> bool:
    try:
        s3_client.head_object(Bucket=bucket, Key=STAGING_COMPLETE_KEY)
        return True
    except s3_client.exceptions.ClientError:
        return False


def lambda_handler(event, context) -> None:
    logger.info("Event data: %s", event)
    bucket = os.environ["S3_BUCKET_NAME"]
    queue_url = os.environ["SQS_QUEUE_URL"]

    records = event.get("Records", [])
    for record in records:
        body = json.loads(record["body"])
        player_id = body["player_id"]
        season = body["season"]

        logger.info("Fetching stats player=%s season=%s", player_id, season)
        stats = fetch_stats(player_id, season)

        staging_key = f"player-stats/staging/{record['messageId']}.json"
        s3_client.put_object(
            Bucket=bucket,
            Key=staging_key,
            Body=json.dumps({player_id: {season: stats}}),
            ContentType="application/json",
        )
        logger.info("Wrote staging file s3://%s/%s", bucket, staging_key)

    if is_queue_drained(queue_url) and not complete_sentinel_exists(bucket):
        s3_client.put_object(
            Bucket=bucket,
            Key=STAGING_COMPLETE_KEY,
            Body=json.dumps({"status": "complete"}),
            ContentType="application/json",
        )
        logger.info(
            "Queue drained — wrote completion sentinel s3://%s/%s",
            bucket,
            STAGING_COMPLETE_KEY,
        )
