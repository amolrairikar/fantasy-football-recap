variable "table_name" {
  description = "The name of the DynamoDB table"
  type        = string
}

variable "hash_key" {
  description = "The attribute to use as the partition key"
  type        = string
}

variable "range_key" {
  description = "The attribute to use as the sort key (optional)"
  type        = string
  default     = ""
}

variable "replica_regions" {
  description = "A list of regions where the global table replicas should be created"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}