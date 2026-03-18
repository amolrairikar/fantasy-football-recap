from unittest.mock import MagicMock, patch

import duckdb
import pytest

from transformer import Transformer


class TestTransform:
    def test_espn_platform_calls_espn_prepare(self):
        transformer = Transformer(platform="ESPN")
        mock_data = {"teams": []}
        mock_con = MagicMock()
        mock_results = {"TEAMS": []}

        with (
            patch.object(
                transformer, "_prepare_table_data_espn", return_value=mock_data
            ) as mock_prep,
            patch.object(
                transformer, "_load_data_duckdb", return_value=mock_con
            ) as mock_load,
            patch.object(
                transformer, "_execute_transformations", return_value=mock_results
            ) as mock_exec,
        ):
            result = transformer.transform(raw_data=[])

        mock_prep.assert_called_once_with(raw_data=[])
        mock_load.assert_called_once_with(data=mock_data)
        mock_exec.assert_called_once_with(con=mock_con)
        assert result == mock_results

    def test_sleeper_platform_calls_sleeper_prepare(self):
        transformer = Transformer(platform="SLEEPER")
        mock_data = {"teams": []}
        mock_con = MagicMock()
        mock_results = {"TEAMS": []}

        with (
            patch.object(
                transformer, "_prepare_table_data_sleeper", return_value=mock_data
            ) as mock_prep,
            patch.object(transformer, "_load_data_duckdb", return_value=mock_con),
            patch.object(
                transformer, "_execute_transformations", return_value=mock_results
            ),
        ):
            result = transformer.transform(raw_data=[])

        mock_prep.assert_called_once_with(raw_data=[])
        assert result == mock_results

    def test_invalid_platform_raises_value_error(self):
        transformer = Transformer(platform="YAHOO")
        with pytest.raises(ValueError, match="Invalid platform"):
            transformer.transform(raw_data=[])


class TestPrepareTableDataEspn:
    def setup_method(self):
        self.transformer = Transformer(platform="ESPN")

    def test_empty_raw_data_returns_empty_lists(self):
        result = self.transformer._prepare_table_data_espn(raw_data=[])
        assert result == {"members": [], "teams": []}

    def test_non_league_information_item_is_skipped(self):
        raw_data = [{"data_type": "settings", "season": "2023", "data": {}}]
        result = self.transformer._prepare_table_data_espn(raw_data=raw_data)
        assert result == {"members": [], "teams": []}

    def test_league_information_with_members_and_teams(self):
        raw_data = [
            {
                "data_type": "league_information",
                "season": "2023",
                "data": {
                    "members": [{"id": "u1", "displayName": "Alice"}],
                    "teams": [{"id": 1, "name": "Team A"}],
                },
            }
        ]
        result = self.transformer._prepare_table_data_espn(raw_data=raw_data)

        assert len(result["members"]) == 1
        assert result["members"][0]["season"] == "2023"
        assert result["members"][0]["id"] == "u1"
        assert len(result["teams"]) == 1
        assert result["teams"][0]["season"] == "2023"

    def test_league_information_with_empty_members_and_teams(self):
        raw_data = [
            {
                "data_type": "league_information",
                "season": "2023",
                "data": {"members": [], "teams": []},
            }
        ]
        result = self.transformer._prepare_table_data_espn(raw_data=raw_data)
        assert result == {"members": [], "teams": []}

    def test_original_record_not_mutated(self):
        original = {"id": "u1"}
        raw_data = [
            {
                "data_type": "league_information",
                "season": "2023",
                "data": {"members": [original], "teams": []},
            }
        ]
        self.transformer._prepare_table_data_espn(raw_data=raw_data)
        assert "season" not in original


class TestPrepareTableDataSleeper:
    def setup_method(self):
        self.transformer = Transformer(platform="SLEEPER")

    def test_empty_raw_data_returns_empty_teams(self):
        result = self.transformer._prepare_table_data_sleeper(raw_data=[])
        assert result == {"teams": []}

    def test_non_users_item_is_skipped(self):
        raw_data = [{"data_type": "drafts", "season": "2023", "data": []}]
        result = self.transformer._prepare_table_data_sleeper(raw_data=raw_data)
        assert result == {"teams": []}

    def test_users_item_with_records(self):
        raw_data = [
            {
                "data_type": "users",
                "season": "2023",
                "data": [
                    {"user_id": "u1", "display_name": "Alice"},
                    {"user_id": "u2", "display_name": "Bob"},
                ],
            }
        ]
        result = self.transformer._prepare_table_data_sleeper(raw_data=raw_data)

        assert len(result["teams"]) == 2
        assert result["teams"][0]["season"] == "2023"
        assert result["teams"][0]["user_id"] == "u1"

    def test_users_item_with_empty_data(self):
        raw_data = [{"data_type": "users", "season": "2023", "data": []}]
        result = self.transformer._prepare_table_data_sleeper(raw_data=raw_data)
        assert result == {"teams": []}


class TestLoadDataDuckdb:
    def setup_method(self):
        self.transformer = Transformer(platform="ESPN")

    def test_empty_data_returns_connection_with_no_tables(self):
        con = self.transformer._load_data_duckdb(data={})
        tables = con.execute("SHOW TABLES").fetchall()
        assert tables == []

    def test_non_empty_data_creates_tables(self):
        data = {
            "teams": [{"id": 1, "name": "Team A"}],
            "members": [{"id": "u1", "displayName": "Alice"}],
        }
        con = self.transformer._load_data_duckdb(data=data)
        tables = {row[0] for row in con.execute("SHOW TABLES").fetchall()}
        assert "teams" in tables
        assert "members" in tables
        count = con.execute("SELECT COUNT(*) FROM teams").fetchone()[0]
        assert count == 1


class TestExecuteTransformations:
    def setup_method(self):
        self.transformer = Transformer(platform="ESPN")

    def _make_connection_with_teams(self):
        con = duckdb.connect(database=":memory:")
        con.execute("CREATE TABLE teams (id INTEGER, name VARCHAR)")
        con.execute("INSERT INTO teams VALUES (1, 'Team A')")
        return con

    def test_matchups_database_key_is_skipped(self):
        con = self._make_connection_with_teams()
        mock_config = {
            "espn": {
                "get_matchups": {
                    "database_key": "MATCHUPS",
                    "query": "SELECT * FROM teams",
                }
            }
        }
        with (
            patch("builtins.open", MagicMock()),
            patch("transformer.yaml.safe_load", return_value=mock_config),
        ):
            result = self.transformer._execute_transformations(con=con)

        assert result == {}

    def test_non_matchups_key_executes_query(self):
        con = self._make_connection_with_teams()
        mock_config = {
            "espn": {
                "get_teams": {
                    "database_key": "TEAMS",
                    "query": "SELECT id, name FROM teams",
                }
            }
        }
        with (
            patch("builtins.open", MagicMock()),
            patch("transformer.yaml.safe_load", return_value=mock_config),
        ):
            result = self.transformer._execute_transformations(con=con)

        assert "TEAMS" in result
        assert result["TEAMS"] == [{"id": 1, "name": "Team A"}]

    def test_both_matchups_and_non_matchups_queries(self):
        con = self._make_connection_with_teams()
        mock_config = {
            "espn": {
                "get_teams": {
                    "database_key": "TEAMS",
                    "query": "SELECT id FROM teams",
                },
                "get_matchups": {
                    "database_key": "MATCHUPS",
                    "query": "SELECT * FROM teams",
                },
            }
        }
        with (
            patch("builtins.open", MagicMock()),
            patch("transformer.yaml.safe_load", return_value=mock_config),
        ):
            result = self.transformer._execute_transformations(con=con)

        assert "TEAMS" in result
        assert "MATCHUPS" not in result
