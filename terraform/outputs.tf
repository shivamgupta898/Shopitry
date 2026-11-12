output "vpc_id" {
  description = "Created VPC ID"
  value       = aws_vpc.main.id
}

output "master_public_ip" {
  description = "Static Elastic IP of the Kubernetes master node"
  value       = aws_eip.master_eip.public_ip
}

output "master_private_ip" {
  description = "Private IP of the Kubernetes master node"
  value       = aws_instance.k8s_master.private_ip
}

output "worker_private_ips" {
  description = "Private IPs of the Kubernetes worker nodes"
  value       = aws_instance.k8s_worker[*].private_ip
}

output "ssh_master_command" {
  description = "SSH command to connect to the control plane node"
  value       = "ssh -i ${var.ssh_key_name}.pem ubuntu@${aws_eip.master_eip.public_ip}"
}