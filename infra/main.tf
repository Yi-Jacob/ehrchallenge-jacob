provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "mentalspace_ehr" {
  engine = "postgres"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  name = "mentalspace_ehr"
  username = "postgres"
  password = "yourpassword"
  skip_final_snapshot = true
}

resource "aws_s3_bucket" "static_client" {
  bucket = "mentalspace-ehr-static-client"
}

# ECS/Fargate resources would go here (task definition, service, etc.) 