resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  body          = templatefile(var.openapi_spec_path, var.openapi_vars)

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
