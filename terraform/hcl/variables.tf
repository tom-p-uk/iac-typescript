variable "prefix" {
  default = "iac"
}

variable "project" {
  default = "iac-ts"
}

variable "contact" {
  default = "email@someemail.com"
}

variable "db_username" {}

variable "db_password" {}

variable "bastion_key_name" {
  default = "iac-ts-bastion-key-pair"
}

variable "ecr_image_api" {
  description = "ECR Image for API"
  default     = "806645795579.dkr.ecr.us-east-1.amazonaws.com/iac-ts-api:latest"
}

