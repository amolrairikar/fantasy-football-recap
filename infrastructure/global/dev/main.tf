terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  providers = {
    aws.primary = aws.primary
    aws.replica = aws.replica
  }

  table_name      = "fantasy-football-recap-table-dev"
  hash_key        = "PK"
  range_key       = "SK"
  replica_regions = ["us-west-2"]
  
  tags = {
    environment = var.environment
    project     = "fantasy-football-recap"
    component   = "database"
    managed-by  = "terraform"
  }
}

module "s3-bidirectional-replication" {
  source = "../../modules/s3"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.replica
  }

  bucket_prefix                      = "fantasy-football-recap-${var.environment}-bucket"
  account_id                         = var.account_id
  primary_aws_region                 = "us-east-1"
  secondary_aws_region               = "us-west-2"
  versioning_enabled                 = true  
  replication_role_name              = "fantasy-football-recap-s3-${var.environment}-replication-role"
  replication_role_description       = "IAM role for replicating objects between east & west dev S3 buckets."
  replication_role_trust_policy_file = "../../../iam/dev/replication-role/trust_policy.json"
  replication_role_policy_file       = "../../../iam/dev/replication-role/role_policy.json"
  lifecycle_rules = [{
    rule_name       = "expire-noncurrent-objects"
    prefix          = ""
    noncurrent_days = 7
  }]
  tags = {
    environment = var.environment
    project     = "fantasy-football-recap"
    component   = "s3"
    managed-by  = "terraform"
  }
}