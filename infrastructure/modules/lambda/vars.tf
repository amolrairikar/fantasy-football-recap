variable "function_name" {
  type        = string
  description = "Unique name for your Lambda function"
}

variable "function_description" {
  type        = string
  description = "Description of what the function does"
  default     = "Managed by Terraform"
}

variable "role_arn" {
  type        = string
  description = "The ARN of the IAM role that the Lambda function assumes"
}

variable "handler" {
  type        = string
  description = "The function entrypoint in your code"
}

variable "layers" {
  type        = list(string)
  description = "List of Lambda Layer ARNs to attach"
  default     = []
}

variable "memory_size" {
  type        = number
  description = "Amount of memory in MB your Lambda Function can use"
  default     = 128
}

variable "timeout" {
  type        = number
  description = "The amount of time your Lambda Function has to run in seconds"
  default     = 3
}

variable "s3_bucket" {
  type        = string
  description = "S3 bucket location of the function's deployment package"
}

variable "s3_key" {
  type        = string
  description = "S3 key of the function's deployment package"
}

variable "environment_variables" {
  type        = map(string)
  description = "A map that defines environment variables for the Lambda function"
  default     = {}
}

variable "log_retention" {
  type        = number
  description = "Specifies the number of days you want to retain log events"
  default     = 14
}

variable "reserved_concurrent_executions" {
  type        = number
  description = "Reserved concurrency (-1 = unreserved)"
  default     = -1
}

variable "tags" {
  type        = map(string)
  description = "A mapping of tags to assign to the object"
  default     = {}
}