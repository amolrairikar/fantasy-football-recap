from unittest.mock import patch

import pytest

from onboarding_service import OnboardingService


def make_espn_service(**kwargs):
    defaults = {"league_id": "123", "platform": "ESPN", "latest_season": "2023"}
    defaults.update(kwargs)
    with (
        patch("onboarding_service.ESPNClient"),
        patch("onboarding_service.Transformer"),
        patch("onboarding_service.DynamoWriter"),
    ):
        return OnboardingService(**defaults)


class TestOnboardingServiceInit:
    def test_latest_season_converted_to_string_when_truthy(self):
        with (
            patch("onboarding_service.ESPNClient"),
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            service = OnboardingService(
                league_id="123", platform="ESPN", latest_season=2023
            )
        assert service.latest_season == "2023"

    def test_latest_season_none_when_falsy(self):
        with (
            patch("onboarding_service.SleeperClient"),
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            service = OnboardingService(
                league_id="123", platform="SLEEPER", latest_season=None
            )
        assert service.latest_season is None

    def test_transformer_and_writer_created_with_correct_args(self):
        with (
            patch("onboarding_service.ESPNClient"),
            patch("onboarding_service.Transformer") as mock_transformer_cls,
            patch("onboarding_service.DynamoWriter") as mock_writer_cls,
        ):
            service = OnboardingService(
                league_id="123", platform="ESPN", latest_season="2023"
            )

        mock_transformer_cls.assert_called_once_with(platform="ESPN")
        mock_writer_cls.assert_called_once_with(league_id="123", platform="ESPN")
        assert service.transformer == mock_transformer_cls.return_value
        assert service.writer == mock_writer_cls.return_value


class TestBuildClient:
    def test_espn_platform_creates_espn_client(self):
        with (
            patch("onboarding_service.ESPNClient") as mock_espn_cls,
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            service = OnboardingService(
                league_id="123",
                platform="ESPN",
                latest_season="2023",
                espn_s2_cookie="s2val",
                swid_cookie="{swid}",
            )

        mock_espn_cls.assert_called_once_with(
            league_id="123",
            latest_season="2023",
            s2="s2val",
            swid="{swid}",
        )
        assert service.client == mock_espn_cls.return_value

    def test_espn_platform_without_season_raises_value_error(self):
        with (
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            with pytest.raises(ValueError, match="Latest season not provided"):
                OnboardingService(league_id="123", platform="ESPN", latest_season=None)

    def test_sleeper_platform_creates_sleeper_client(self):
        with (
            patch("onboarding_service.SleeperClient") as mock_sleeper_cls,
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            service = OnboardingService(league_id="456", platform="SLEEPER")

        mock_sleeper_cls.assert_called_once_with("456")
        assert service.client == mock_sleeper_cls.return_value

    def test_unsupported_platform_raises_value_error(self):
        with (
            patch("onboarding_service.Transformer"),
            patch("onboarding_service.DynamoWriter"),
        ):
            with pytest.raises(ValueError, match="Unsupported platform: YAHOO"):
                OnboardingService(league_id="123", platform="YAHOO")


class TestRun:
    def test_run_calls_fetch_transform_and_write(self):
        raw_data = [{"season": "2023", "data_type": "league_information", "data": {}}]
        mock_views = {"teams": []}

        with (
            patch("onboarding_service.ESPNClient"),
            patch("onboarding_service.Transformer") as mock_transformer_cls,
            patch("onboarding_service.DynamoWriter") as mock_writer_cls,
            patch("onboarding_service.asyncio.run", return_value=raw_data) as mock_run,
        ):
            service = OnboardingService(
                league_id="123", platform="ESPN", latest_season="2023"
            )
            mock_transformer = mock_transformer_cls.return_value
            mock_transformer.transform.return_value = mock_views
            mock_writer = mock_writer_cls.return_value

            service.run()

        mock_run.assert_called_once()
        mock_transformer.transform.assert_called_once_with(raw_data=raw_data)
        mock_writer.write_all.assert_called_once_with(views=mock_views)
