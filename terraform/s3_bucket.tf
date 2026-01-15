

resource "aws_s3_bucket" "cloudinframodule_bucket" {
  bucket = "cloudinframodule-bucket"

  # Optional: enable versioning
  versioning {
    enabled = false
  }

  # Optional: configure ACL
  acl = "private"

  tags = {
    Name        = "cloudinframodule-bucket"
    Environment = "dev"
  }
}
