resource "aws_s3_bucket" "static" {
  bucket = "${var.app_name}-static-assets"
  acl    = "private"
  force_destroy = true
  tags = { Name = "${var.app_name}-static" }
} 