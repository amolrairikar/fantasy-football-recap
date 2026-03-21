import json

import requests

from onboarding_service import OnboardingService
from utils import logger


def lambda_handler(event, context) -> dict[str, str | int]:
    """
    Main handler function for league onboarder.

    Args:
        event: The event data that triggered the Lambda function.
        context: The context in which the Lambda function is running.

    Returns:
        dict: A response indicating the success of the operation.
    """
    body = event["body"]
    # NOTE: We cannot log the event due to the potential for sensitive ESPN cookies
    logger.info("Starting league onboarding process execution.")
    logger.info("Context data: %s", context)

    try:
        service = OnboardingService(
            league_id=str(body["leagueId"]),
            platform=body["platform"],
            latest_season=body.get("season"),
            espn_s2_cookie=body.get("s2"),
            swid_cookie=body.get("swid"),
        )
    except KeyError as e:
        logger.error("Missing required field in request body: %s", e)
        return {
            "statusCode": 400,
            "body": json.dumps({"status": "failed", "error_msg": str(e)}),
        }
    except ValueError as e:
        logger.error(
            "Incorrect value error while initializing onboarding service: %s", e
        )
        return {
            "statusCode": 400,
            "body": json.dumps({"status": "failed", "error_msg": str(e)}),
        }
    except requests.exceptions.HTTPError as e:
        logger.error(
            "Request error occurred fetching data while initializing onboarding service: %s",
            e,
        )
        return {
            "statusCode": 502,
            "body": json.dumps({"status": "failed", "error_msg": str(e)}),
        }
    except RuntimeError as e:
        logger.error(
            "Runtime error occurred while initializing onboarding service: %s", e
        )
        return {
            "statusCode": 502,
            "body": json.dumps({"status": "failed", "error_msg": str(e)}),
        }

    try:
        service.run()
    except RuntimeError as e:
        logger.error("Runtime error occurred while running onboarding service: %s", e)
        return {
            "statusCode": 502,
            "body": json.dumps({"status": "failed", "error_msg": str(e)}),
        }
    except Exception as e:
        logger.error(
            "Unexpected error occurred while running onboarding service: %s", e
        )
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "status": "failed",
                    "error_msg": f"Unexpected error occurred: {str(e)}",
                }
            ),
        }

    logger.info("Ending league onboarding process execution.")
    return {
        "statusCode": 200,
        "body": json.dumps({"status": "succeeded", "leagueId": body["leagueId"]}),
    }


lambda_handler(
    event={
        "name": "test-event",
        "body": {
            "leagueId": "1770206",
            "platform": "ESPN",
            "season": "2025",
            "swid": "{5C607AAE-F39B-4BF7-8306-BEE68C48A53B}",
            "s2": "AECS%2Fm2P8g7pbnggkucc8qDrpgHgQ22PkiTn8ia8%2FNpb5AaWTjiYw1fc%2FjMtPaCDzWqLEPpD1yz%2BlCZ7rbZSrCcyV5LmaeM9qYwdOz30AcZnC8ZRolRGvP2%2BfMgME0L26v41DrytOJdvXM9rwGA8Mau1DJmuHjedA55tdQlzzTm5WqPkGeZbLB35C96v8UUBEDiq6WuzDvjMaOVnZVExD1U9HjhgGZp4jsUi58BTTPIkjMYIt3nfIeiItIs4hQjyRWYfhZW9jrpEPzX%2BCtuLpqdWNhjfU4l6tP%2BYfE0S1Ih84YDtmXhFTkzKj7oXwKSAuPQ%3D",
        },
    },
    context={},
)
