resource "aws_cloudwatch_log_group" "ecs_api" {
  name              = "/ecs/${var.app_name}-api"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "ecs_frontend" {
  name              = "/ecs/${var.app_name}-frontend"
  retention_in_days = 7
}

# Example alarm for ALB 5xx error rate (sketch)
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.app_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alarm if ALB 5xx errors exceed threshold"
  dimensions = {
    LoadBalancer = aws_lb.main.name
  }
} 