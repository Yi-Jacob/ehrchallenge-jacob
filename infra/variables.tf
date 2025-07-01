variable "aws_region" {
  description = "AWS region to deploy to"
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "Database master username"
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name prefix"
  default     = "mentalspace-ehr"
} 