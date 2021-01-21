# resource "aws_s3_bucket" "app_public_files" {
#   bucket        = "${local.prefix}-files"
#   acl           = "public-read"
#   force_destroy = true // allows bucket to be removed without prompts - useful for CI
# }
