terraform {
  backend "s3" {
    bucket         = "iac-ts-tfstate"
    key            = "iac-ts.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "iac-ts-tfstate-lock"
  }
}

provider "aws" {
  region  = "us-east-1"
  version = "~> 2.50.0"
}

locals {
  prefix = "${var.prefix}-${terraform.workspace}"
  common_tags = {
    Environment = terraform.workspace
    Project     = var.project
    Owner       = var.contact
    ManagedBy   = "Terraform"
  }
}

data "aws_region" "current" {}
