import base64
import json
import os

import boto3
from behave import given, when, use_step_matcher
from behave.runner import Context
from dotenv import load_dotenv

use_step_matcher("re")


@given(r"a (valid|invalid) set of (.+) league inputs")  # type: ignore[reportCallIssue]
def step_given_valid_espn_league_inputs(
    context: Context, input_validity: str, platform: str
):
    load_dotenv()

    if input_validity == "valid":
        if platform == "ESPN":
            context.league_id = "1770206"
            context.platform = platform
            context.season = os.environ["SEASON"]
            context.s2 = os.environ["S2"]
            context.swid = os.environ["SWID"]
            context.lambda_payload = {
                "name": "test-event",
                "body": {
                    "leagueId": context.league_id,
                    "platform": context.platform,
                    "season": context.season,
                    "swid": context.swid,
                    "s2": context.s2,
                },
            }
        else:
            context.league_id = "1251587932842627072"
            context.platform = platform
            context.season = os.environ["SEASON"]
            context.lambda_payload = {
                "name": "test-event",
                "body": {
                    "leagueId": context.league_id,
                    "platform": context.platform,
                },
            }
        context.lambda_client_context = base64.b64encode(
            json.dumps({}).encode("utf-8")
        ).decode("utf-8")


@when("we run the onboarding lambda")  # type: ignore[reportCallIssue]
def step_run_onboarding_lambda(context):
    client = boto3.client("lambda")

    response = client.invoke(
        FunctionName="fantasy-football-recap-onboarder-dev-east",
        InvocationType="RequestResponse",
        Payload=json.dumps(getattr(context, "lambda_payload", {})),
        ClientContext=context.lambda_client_context,
    )

    payload_bytes = response["Payload"].read()
    context.lambda_response = {
        "status_code": response["StatusCode"],
        "payload": json.loads(payload_bytes),
    }
