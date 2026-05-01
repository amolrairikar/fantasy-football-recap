import json
import logging
import time
from typing import Any, Sequence

V2_CUTOFF = 2018
EXTENDED_SEASON_CUTOFF = 2021


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
    logger = logging.getLogger("leagueql")
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    if not logger.handlers:
        logger.addHandler(handler)
    return logger


logger = setup_logger()


def validate_api_results(
    results: Sequence[dict[str, Any] | BaseException],
) -> list[dict[str, Any]]:
    """
    Validates raw asyncio.gather results, raising on any exception or None data.

    Args:
        results: Raw results from asyncio.gather, which may include BaseException instances.

    Returns:
        List of validated result dicts, guaranteed to have non-None data fields.
    """
    validated = []
    for result in results:
        if isinstance(result, BaseException):
            logger.error("Unhandled exception in gather: %s", result)
            raise RuntimeError(
                f"Unexpected error occurred while fetching data: {result}"
            )
        if result["data"] is None:
            raise RuntimeError(
                f"Failed to get data for season {result['season']} and data type {result['data_type']}"
            )
        validated.append(result)
    return validated
