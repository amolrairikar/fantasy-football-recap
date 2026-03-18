import os
from decimal import Decimal
from unittest.mock import MagicMock, patch

from writer import DynamoWriter


def make_writer(league_id="123", platform="ESPN"):
    mock_table = MagicMock()
    mock_dynamodb = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    with (
        patch("writer.boto3.resource", return_value=mock_dynamodb),
        patch.dict(os.environ, {"DYNAMODB_TABLE_NAME": "test-table"}),
    ):
        writer = DynamoWriter(league_id=league_id, platform=platform)

    return writer, mock_table


def _setup_batch_mock(mock_table):
    mock_batch = MagicMock()
    mock_batch_ctx = MagicMock()
    mock_batch_ctx.__enter__.return_value = mock_batch
    mock_batch_ctx.__exit__.return_value = False
    mock_table.batch_writer.return_value = mock_batch_ctx
    return mock_batch


class TestDynamoWriterInit:
    def test_stores_league_id_and_platform(self):
        writer, _ = make_writer(league_id="456", platform="SLEEPER")
        assert writer.league_id == "456"
        assert writer.platform == "SLEEPER"

    def test_creates_table_from_env_var(self):
        mock_dynamodb = MagicMock()
        with (
            patch("writer.boto3.resource", return_value=mock_dynamodb) as mock_boto3,
            patch.dict(os.environ, {"DYNAMODB_TABLE_NAME": "my-table"}),
        ):
            DynamoWriter(league_id="123", platform="ESPN")

        mock_boto3.assert_called_once_with("dynamodb")
        mock_dynamodb.Table.assert_called_once_with("my-table")


class TestWriteAll:
    def test_empty_views_skips_batch_put(self):
        writer, mock_table = make_writer()
        mock_batch = _setup_batch_mock(mock_table)

        writer.write_all(views={})

        mock_batch.put_item.assert_not_called()

    def test_non_empty_views_calls_batch_put_for_each(self):
        writer, mock_table = make_writer()
        mock_batch = _setup_batch_mock(mock_table)

        writer.write_all(views={"TEAMS": [{"id": 1}], "MATCHUPS": []})

        assert mock_batch.put_item.call_count == 2

    def test_batch_put_item_uses_correct_pk_and_sk(self):
        writer, mock_table = make_writer(league_id="123", platform="ESPN")
        mock_batch = _setup_batch_mock(mock_table)

        writer.write_all(views={"TEAMS": [{"id": 1}]})

        item = mock_batch.put_item.call_args[1]["Item"]
        assert item["PK"] == "LEAGUE#123#PLATFORM#ESPN"
        assert item["SK"] == "TEAMS"

    def test_metadata_put_item_always_called(self):
        writer, mock_table = make_writer(league_id="123")
        _setup_batch_mock(mock_table)

        writer.write_all(views={})

        item = mock_table.put_item.call_args[1]["Item"]
        assert item["PK"] == "LEAGUE#123"
        assert item["SK"] == "METADATA"
        assert item["status"] == "active"
        assert "onboardedAt" in item

    def test_update_item_increments_league_count(self):
        writer, mock_table = make_writer()
        _setup_batch_mock(mock_table)

        writer.write_all(views={})

        kwargs = mock_table.update_item.call_args[1]
        assert kwargs["Key"] == {"PK": "APP#STATS", "SK": "LEAGUE_COUNT"}
        assert ":inc" in kwargs["ExpressionAttributeValues"]
        assert kwargs["ExpressionAttributeValues"][":inc"] == 1

    def test_batch_data_is_serialized(self):
        writer, mock_table = make_writer()
        mock_batch = _setup_batch_mock(mock_table)

        writer.write_all(views={"TEAMS": [{"score": 98.5}]})

        item = mock_batch.put_item.call_args[1]["Item"]
        assert isinstance(item["data"][0]["score"], Decimal)


class TestSerialize:
    def setup_method(self):
        self.writer, _ = make_writer()

    def test_floats_converted_to_decimal(self):
        result = self.writer._serialize([{"score": 98.5}])
        assert isinstance(result[0]["score"], Decimal)
        assert result[0]["score"] == Decimal("98.5")

    def test_non_float_values_unchanged(self):
        data = {"name": "Alice", "id": 1}
        result = self.writer._serialize(data)
        assert result == {"name": "Alice", "id": 1}

    def test_nested_floats_converted(self):
        result = self.writer._serialize({"team": {"score": 10.5}})
        assert isinstance(result["team"]["score"], Decimal)
