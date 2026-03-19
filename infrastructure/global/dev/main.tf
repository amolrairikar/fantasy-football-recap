terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "dynamodb" {
  source          = "../../modules/dynamodb"

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