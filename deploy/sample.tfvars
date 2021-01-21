# sample varables. only ones assigned in terraform.tfvars actually get used. this is a sample terraform.tfvars file

# variables.tf is used to declare variables, along with their types and default values
# terraform.tfvars is used to set the actual values of the variables
# if no terraform.tfvars file is present, env vars prepended with TF_VAR will be used (e.g. TF_VAR_db_username). if both are missing, users are either prompted for values

db_username       = "recipeapp"
db_password       = "changeme"
