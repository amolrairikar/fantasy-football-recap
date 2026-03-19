terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      configuration_aliases = [ aws.primary, aws.secondary ]
    }
  }
}

locals {
  primary_region = element(split("-", var.primary_aws_region), 1)
  secondary_region = element(split("-", var.secondary_aws_region), 1)
}

resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.bucket_prefix}-${local.primary_region}-${var.account_id}"
  tags     = var.tags
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider   = aws.primary
  depends_on = [aws_s3_bucket_versioning.primary]
  bucket     = aws_s3_bucket.primary.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.rule_name
      status = "Enabled"

      filter {
        prefix = rule.value.prefix
      }

      noncurrent_version_expiration {
        noncurrent_days = rule.value.noncurrent_days
      }

      expiration {
        expired_object_delete_marker = true
      }
    }
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.bucket_prefix}-${local.secondary_region}-${var.account_id}"
  tags     = var.tags
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "secondary" {
  provider   = aws.secondary
  depends_on = [aws_s3_bucket_versioning.secondary]
  bucket     = aws_s3_bucket.secondary.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.rule_name
      status = "Enabled"

      filter {
        prefix = rule.value.prefix
      }

      noncurrent_version_expiration {
        noncurrent_days = rule.value.noncurrent_days
      }

      expiration {
        expired_object_delete_marker = true
      }
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.primary
  depends_on = [aws_iam_role_policy.this, aws_s3_bucket_versioning.primary]
  role       = aws_iam_role.this.arn
  bucket     = aws_s3_bucket.primary.id

  rule {
    id     = "primary-to-secondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "secondary_to_primary" {
  provider   = aws.secondary
  depends_on = [aws_iam_role_policy.this, aws_s3_bucket_versioning.secondary]
  role       = aws_iam_role.this.arn
  bucket     = aws_s3_bucket.secondary.id

  rule {
    id     = "secondary-to-primary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.primary.arn
      storage_class = "STANDARD"
    }
  }
}

resource "aws_iam_role" "this" {
  name        = var.replication_role_name
  description = var.replication_role_description

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "this" {
  name   = "${var.replication_role_name}-policy"
  role   = aws_iam_role.this.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBucketLevelPermissions"
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_prefix}-${local.primary_region}-${var.account_id}",
          "arn:aws:s3:::${var.bucket_prefix}-${local.secondary_region}-${var.account_id}"
        ]
      },
      {
        Sid    = "AllowObjectLevelPermissions"
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersion*",
          "s3:Replicate*"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_prefix}-${local.primary_region}-${var.account_id}/*",
          "arn:aws:s3:::${var.bucket_prefix}-${local.secondary_region}-${var.account_id}/*"
        ]
      }
    ]
  })
}