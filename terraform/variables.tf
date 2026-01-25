variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "rajikshan-cloud-inframodule"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "app_count" {
  description = "Number of tasks to run"
  type        = number
  default     = 2
}