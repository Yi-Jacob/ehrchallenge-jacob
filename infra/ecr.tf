resource "aws_ecr_repository" "api" {
  name = "${var.app_name}-api"
}

resource "aws_ecr_repository" "frontend" {
  name = "${var.app_name}-frontend"
} 