Feature: Onboard fantasy football league

    @writes_data
    Scenario: Successfully onboard ESPN league
        Given a valid set of ESPN league inputs
        When we run the onboarding lambda
        # Then the lambda will complete successfully
        # And the lambda response object status code will be 200
        # And the DynamoDB table will contain 3 items