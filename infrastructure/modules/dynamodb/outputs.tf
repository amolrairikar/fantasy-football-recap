output "table_arn" {
  description = "The ARN of the DynamoDB table"
  value       = aws_dynamodb_table.global_table.arn
}

output "table_id" {
  description = "The name (id) of the DynamoDB table"
  value       = aws_dynamodb_table.global_table.id
}