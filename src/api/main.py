import json
import logging
import os
import time
from enum import Enum
from typing import Annotated, Any, Optional

import boto3
import botocore.exceptions
from fastapi import FastAPI, HTTPException, Path, status, Query
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

ORIGINS = [
    "http://localhost:5173",  # LOCAL/DEV
]


class APIResponse(BaseModel):
    detail: str
    data: Optional[Any] = None


class Platform(str, Enum):
    SLEEPER = "SLEEPER"
    ESPN = "ESPN"

    @classmethod
    def _missing_(cls, value: object):
        """Standard-compliant override for case-insensitive lookup."""
        if isinstance(value, str):
            normalized_value = value.upper()
            for member in cls:
                if member.value == normalized_value:
                    return member
        return None


class JsonFormatter(logging.Formatter):
    """Class to format logs in JSON format."""

    def format(self, record) -> str:
        """
        Format the log record as a JSON object.

        Args:
            record (logging.LogRecord): The log record to format.

        Returns:
            str: JSON formatted log string.
        """
        log_object = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "message": record.getMessage(),
            "function": record.funcName,
        }
        return json.dumps(log_object)


def setup_logger() -> logging.Logger:
    """
    Set up the logger with JSON formatted log entries.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.handlers = [handler]
    return logger


logger = setup_logger()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: look into adding a custom config for retries
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])


@app.get("/", status_code=status.HTTP_200_OK)
def root() -> APIResponse:
    """Makes health check to API root URL."""
    return APIResponse(detail="Healthy!")


@app.get("/leagues/{leagueId}", status_code=status.HTTP_200_OK)
def get_league(
    leagueId: Annotated[
        str, Path(description="The ID of the fantasy league", pattern=r"^\d+$")
    ],
    platform: Annotated[Platform, Query(description="The platform the league is on")],
) -> APIResponse:
    """Gets league by league ID and platform."""
    pk = f"LEAGUE#{leagueId}#PLATFORM#{platform.value}"
    sk = "LEAGUE_LOOKUP"
    try:
        response = table.get_item(Key={"PK": pk, "SK": sk})
    except botocore.exceptions.ClientError as e:
        logger.error("Boto error occurred: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )

    item = response.get("Item")
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {leagueId} not found for {platform.value} platform",
        )

    if not item.get("canonical_league_id"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"canonical_league_id not created for league {leagueId} on {platform.value} platform",
        )

    return APIResponse(
        detail="Found league",
        data={"canonical_league_id": item.get("canonical_league_id")},
    )


handler = Mangum(app)
