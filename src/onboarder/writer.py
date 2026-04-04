import datetime
import json
import os
from typing import Any

import boto3
import botocore.exceptions

from utils import logger


def upload_results_to_s3(
    results: list[dict[str, Any]], bucket_name: str, prefix: str
) -> None:
    """
    Uploads raw API data to S3 as per-season files plus a manifest.

    Groups results by season and writes one {season}.json per season, then
    writes manifest.json last (which is the S3 trigger target for the processor).

    Args:
        results: List containing raw API results.
        bucket_name: Name of the S3 bucket to upload data to.
        prefix: Key prefix within the S3 bucket (e.g. "raw-api-data/{platform}/{league_id}").
    """
    try:
        s3 = boto3.client("s3")

        seasons_data: dict[str, list[dict[str, Any]]] = {}
        for item in results:
            season = item["season"]
            seasons_data.setdefault(season, []).append(item)

        for season, season_results in seasons_data.items():
            s3.put_object(
                Bucket=bucket_name,
                Key=f"{prefix}/{season}.json",
                Body=json.dumps(season_results),
                ContentType="application/json",
            )

        manifest = {"seasons": sorted(seasons_data.keys())}
        s3.put_object(
            Bucket=bucket_name,
            Key=f"{prefix}/manifest.json",
            Body=json.dumps(manifest),
            ContentType="application/json",
        )
    except botocore.exceptions.ClientError as e:
        logger.error("Error occurred while writing raw API JSON to S3: %s", e)
        raise e


def write_onboarding_status_to_dynamodb(
    league_id: str,
    platform: str,
    canonical_league_id: str,
    seasons: list[str],
    request_type: str,
):
    """
    Writes the onboarding status to DynamoDB for client to poll to determine onboarding status.

    Args:
        league_id: The ID for the league on its platform.
        platform: The platform (e.g., ESPN, SLEEPER) that the league is on.
        canonical_league_id: The unique ID for the league.
        seasons: List of strings representing number of seasons league was active for prior to onboarding.
        request_type: The type of onboarding request (e.g., "ONBOARD" or "REFRESH")
    """
    try:
        dynamodb = boto3.client("dynamodb")
        table_name = os.environ["DYNAMODB_TABLE_NAME"]
        now_iso = datetime.datetime.now().isoformat()

        if request_type == "REFRESH":
            transact_items = [
                {
                    "Update": {
                        "TableName": table_name,
                        "Key": {
                            "PK": {"S": f"LEAGUE#{canonical_league_id}"},
                            "SK": {"S": "METADATA"},
                        },
                        "UpdateExpression": "SET refresh_status = :rs, last_refreshed_date = :rd",
                        "ExpressionAttributeValues": {
                            ":rs": {"S": "refreshing"},
                            ":rd": {"S": now_iso},
                        },
                    }
                },
                {
                    "Update": {
                        "TableName": table_name,
                        "Key": {
                            "PK": {"S": f"LEAGUE#{league_id}#PLATFORM#{platform}"},
                            "SK": {"S": "LEAGUE_LOOKUP"},
                        },
                        "UpdateExpression": "ADD seasons :s",
                        "ExpressionAttributeValues": {
                            ":s": {"SS": seasons},
                        },
                    }
                },
            ]
        else:
            transact_items = [
                {
                    "Put": {
                        "TableName": table_name,
                        "Item": {
                            "PK": {"S": f"LEAGUE#{canonical_league_id}"},
                            "SK": {"S": "METADATA"},
                            "platform": {"S": platform},
                            "onboarded_at": {"S": now_iso},
                            "onboarding_status": {"S": "onboarding"},
                        },
                    }
                },
                {
                    "Put": {
                        "TableName": table_name,
                        "Item": {
                            "PK": {"S": f"LEAGUE#{league_id}#PLATFORM#{platform}"},
                            "SK": {"S": "LEAGUE_LOOKUP"},
                            "canonical_league_id": {"S": canonical_league_id},
                            "seasons": {"SS": seasons},
                        },
                    }
                },
            ]

        dynamodb.transact_write_items(TransactItems=transact_items)
    except KeyError as e:
        logger.error("Environment variable 'DYNAMODB_TABLE_NAME' not set!")
        raise e
    except botocore.exceptions.ClientError as e:
        logger.error(
            "Error occurred while writing onboarding job status to DynamoDB: %s", e
        )
        raise e
