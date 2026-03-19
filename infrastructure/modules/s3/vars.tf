variable "bucket_prefix" {
  description = "The prefix for the two S3 buckets"
  type        = string
}

variable "tags" {
  description = "Additional tags for the S3 buckets"
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Boolean to enable or disable versioning"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules to apply to the buckets"
  type = list(object({
    rule_name       = string
    prefix          = string
    noncurrent_days = number
  }))
  default = []
}

variable "destination_bucket_arn" {
  description = "The ARN of the destination bucket for replication"
  type        = string
  default     = null
}

variable "account_id" {
  description = "The 12 digit ID for the AWS account to deploy to"
  type        = string
  default     = null
}

variable "primary_aws_region" {
  description = "The name of the primary AWS region"
  type        = string
  default     = null
}

variable "secondary_aws_region" {
  description = "The name of the secondary AWS region"
  type        = string
  default     = null
}

variable "replication_role_name" {
  description = "The name of the IAM role to use for S3 replication"
  type        = string
  default     = null
}

variable "replication_role_description" {
  description = "The description for the IAM role to use for S3 replication"
  type        = string
  default     = null
}

variable "replication_role_trust_policy_file" {
  description = "The relative path to the JSON file containing the trust (assume role) policy for the replication role"
  type        = string
  default     = null
}

variable "replication_role_policy_file" {
  description = "The relative path to the JSON file containing the permissions policy for the replication role"
  type        = string
  default     = null
}