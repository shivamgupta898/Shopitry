resource "aws_security_group" "k8s_master" {
  name        = "shopitry-k8s-master-sg"
  description = "Security group for Kubernetes control plane node"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH access from admin IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "Kubernetes API server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr, var.allowed_ssh_cidr]
  }

  ingress {
    description = "Internal VPC cluster communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "shopitry-k8s-master-sg"
  }
}

resource "aws_security_group" "k8s_worker" {
  name        = "shopitry-k8s-worker-sg"
  description = "Security group for private Kubernetes worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Internal VPC and control plane traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Kubernetes NodePort range for ALB target groups"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "shopitry-k8s-worker-sg"
  }
}