# variables.tf is used to declare variables, along with their types, descriptions and default values
# terraform.tfvars is used to set the actual values of the variables

variable "prefix" {
  default = "raad"
}

variable "project" {
  default = "recipe-app-api-devops"
}

variable "contact" {
  default = "email@someemail.com"
}

variable "db_username" {}

variable "db_password" {}

variable "bastion_key_name" {
  default = "recipe-app-api-devops-bastion"
}

variable "ecr_image_api" {
  description = "ECR Image for API"
  default     = "806645795579.dkr.ecr.us-east-1.amazonaws.com/recipe-app-api-devops:latest" # if we ever want to deploy from local machine, the default will be used
}

