output "api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "invoke_url" {
  value = "${aws_api_gateway_stage.this.invoke_url}"
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}