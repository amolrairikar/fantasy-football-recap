variable "bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

variable "tags" {
  description = "Additional tags for the S3 bucket"
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Boolean to enable or disable versioning"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules to apply to the bucket"
  type = list(object({
    rule_name       = string
    prefix          = string
    noncurrent_days = number
  }))
  default = []
}

variable "replication_role_arn" {
  description = "The ARN of the IAM role to use for S3 replication. If null, replication will not be configured."
  type        = string
  default     = null
}

variable "destination_bucket_arn" {
  description = "The ARN of the destination bucket for replication"
  type        = string
  default     = null
}