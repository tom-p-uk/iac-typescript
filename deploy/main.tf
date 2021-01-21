terraform {
  backend "s3" {
    bucket         = "terraform-course-tfstate"
    key            = "recipe-app.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "recipe-app-api-devops-tfstate-lock"
  }
}

provider "aws" {
  region  = "us-east-1"
  version = "~> 2.50.0"
}

locals { // used for creating dynamic variables
  prefix = "${var.prefix}-${terraform.workspace}"
  common_tags = {
    Environment = terraform.workspace
    Project     = var.project
    Owner       = var.contact
    ManagedBy   = "Terraform"
  }
}

data "aws_region" "current" {}
