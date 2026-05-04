import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from utils import logger

s3_client = boto3.client("s3")

PLAYER_STATS_FINAL_KEY = "player-stats/sleeper_nfl_player_stats.json"
STAGING_PREFIX = "player-stats/staging/"
STAGING_COMPLETE_KEY = "player-stats/staging/complete.json"


def read_staging_file(bucket: str, key: str) -> dict:
    response = s3_client.get_object(Bucket=bucket, Key=key)
    return json.loads(response["Body"].read())


def lambda_handler(event, context) -> None:
    logger.info("Event data: %s", event)
    bucket = os.environ["S3_BUCKET_NAME"]

    paginator = s3_client.get_paginator("list_objects_v2")
    all_staging_keys = [
        obj["Key"]
        for page in paginator.paginate(Bucket=bucket, Prefix=STAGING_PREFIX)
        for obj in page.get("Contents", [])
    ]
    staging_keys = [k for k in all_staging_keys if not k.endswith("complete.json")]

    if not staging_keys:
        logger.info("No staging files found — aggregation is a no-op.")
        return
    logger.info("Merging %d staging files", len(staging_keys))

    merged: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {
            executor.submit(read_staging_file, bucket, k): k for k in staging_keys
        }
        for future in as_completed(futures):
            partial = future.result()
            for player_id, season_stats in partial.items():
                if player_id not in merged:
                    merged[player_id] = {}
                for season, stats in season_stats.items():
                    if stats is not None:
                        merged[player_id][season] = stats

    s3_client.put_object(
        Bucket=bucket,
        Key=PLAYER_STATS_FINAL_KEY,
        Body=json.dumps(merged),
        ContentType="application/json",
    )
    logger.info("Wrote merged stats for %d players", len(merged))

    for i in range(0, len(all_staging_keys), 1000):
        chunk = all_staging_keys[i : i + 1000]
        s3_client.delete_objects(
            Bucket=bucket, Delete={"Objects": [{"Key": k} for k in chunk]}
        )
    logger.info("Deleted %d staging files", len(all_staging_keys))
