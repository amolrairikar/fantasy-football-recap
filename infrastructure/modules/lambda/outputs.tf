output "lambda_arn" {
  description = "The ARN of the Lambda Function"
  value       = aws_lambda_function.this.arn
}

output "lambda_invoke_arn" {
  description = "The ARN to be used for invoking the Lambda Function from API Gateway"
  value       = aws_lambda_function.this.invoke_arn
}

output "log_group_name" {
  description = "The name of the Cloudwatch Log Group"
  value       = aws_cloudwatch_log_group.lambda_log_group[0].name
}