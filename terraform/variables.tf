variable "aws_region" {
  description = "AWS region for Shopitry cluster"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for Shopitry VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "master_instance_type" {
  description = "EC2 instance type for Kubernetes control plane"
  type        = string
  default     = "m7i-flex.large"
}

variable "worker_instance_type" {
  description = "EC2 instance type for Kubernetes worker nodes"
  type        = string
  default     = "m7i-flex.large"
}

variable "worker_count" {
  description = "Number of private worker nodes"
  type        = number
  default     = 2
}

variable "ssh_key_name" {
  description = "Existing AWS EC2 key pair name for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Admin IP CIDR allowed for SSH access to master node"
  type        = string
  default     = "0.0.0.0/0"
}