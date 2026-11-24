# Shopitry — Microservices E-Commerce Platform on Kubernetes

[![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.31.14-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)](https://www.sonarsource.com/products/sonarqube/)
[![ArgoCD](https://img.shields.io/badge/ArgoCD-v3.6.1-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)](https://argo-cd.readthedocs.io/)
[![Datadog](https://img.shields.io/badge/Datadog-632CA6?style=for-the-badge&logo=datadog&logoColor=white)](https://www.datadoghq.com/)
[![NGINX](https://img.shields.io/badge/NGINX%20Ingress-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://kubernetes.github.io/ingress-nginx/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Project Summary

I built Shopitry as a microservices e-commerce platform inside the `shopitry` Kubernetes namespace so I could put cloud infrastructure, container orchestration, CI/CD automation, GitOps, and cluster monitoring together in one practical setup. Instead of keeping the shopping storefront, admin panel, backend APIs, and databases inside one monolithic application, I separated them into independent workloads so each part can be updated, tested, and scaled on its own without disrupting unrelated services. Incoming HTTPS traffic hits NGINX Ingress on NodePort `32152` and routes by path to `storefront` (`/`), `admin-dashboard` (`/admin`), or `api-gateway` (`/api`, port `4000`). Behind the gateway, `catalog-service` (`4001`) manages product listings and catalog records in `mongodb-0`, while `cart-service` (`4002`), `order-service` (`4003`), `payment-service` (`4004`), and `notification-service` (`4005`) handle cart state, order creation, payment checks, and notifications backed by `postgres-0`. When CPU demand increases, Horizontal Pod Autoscalers scale `api-gateway` and `catalog-service` between `2` and `10` replicas. On AWS (`ap-south-1`), I used Terraform with S3 remote state (`shopitry-terraform-state-bucket`) to provision three Ubuntu `24.04.5 LTS` `m7i-flex.large` nodes (`shopitry-k8s-master`, `shopitry-k8s-worker-1`, and `shopitry-k8s-worker-2`) running `containerd` and Kubernetes `v1.31.14` with Calico networking and `ingress-nginx`. Every change pushed to `main` goes through GitHub Actions (`ci.yml`) matrix builds and SonarQube quality checks (`:9000`), pushes images to Docker Hub (`shivamgupta898/shopitry-*`), syncs cluster resources automatically through ArgoCD (`v3.6.1`), and reports host and container telemetry to Datadog. Looking through this repository shows how VPC networking, `kubeadm` cluster setup, ingress routing, autoscaling, stateful storage, quality gates, and GitOps fit together in practice.

## System Architecture

```text
+-----------------------------------------------------------------------+
| Client Browser                                                        |
| Target Endpoint: https://<k8s-master-public-ip>:32152                 |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| AWS EC2 (ap-south-1) — Kubernetes Cluster (v1.31.14, containerd)     |
|                                                                       |
|  +-----------------------+  +-----------------------+  +------------+ |
|  | shopitry-k8s-master   |  | shopitry-k8s-worker-1 |  | worker-2   | |
|  | (control-plane)       |  | (worker + Datadog)    |  | (worker)   | |
|  +-----------------------+  +-----------+-----------+  +-----+------+ |
|                                         |                    |        |
|  Namespace: shopitry                    v                    v        |
|  +-----------------------------------------------------------------+  |
|  | NGINX Ingress -> API Gateway (Port 4000)                        |  |
|  |  |-- Frontend: storefront, admin-dashboard                      |  |
|  |  |-- catalog-service (4001) [HPA: 2-10]                         |  |
|  |  |-- cart-service (4002)                                        |  |
|  |  |-- order-service (4003)                                       |  |
|  |  |-- payment-service (4004)                                     |  |
|  |  |-- notification-service (4005)                                |  |
|  |  |-- StatefulSets: mongodb-0, postgres-0                        |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

## Frontend Architecture

The frontend has two separate Kubernetes `Deployment` workloads (`2` replicas each) routed by path through NGINX Ingress:

- **`storefront` (`/`):** Customer shopping interface where users browse products, add items to the cart, and place orders.
- **`admin-dashboard` (`/admin`):** Internal panel for managing products, stock, and order states.
- **Gateway Routing (`/api`):** Both frontends send API calls through `/api` to `api-gateway` (`4000`) instead of calling microservices or databases directly.

## Backend Microservices

All backend services and databases run in the `shopitry` namespace using ClusterIP services:

| Workload | Kind | Port | Replicas / Scaling | What It Handles |
| --- | --- | --- | --- | --- |
| `api-gateway` | Deployment | 4000 | HPA (`2–10`) | Auth checks, token validation, and routing requests to services |
| `catalog-service` | Deployment | 4001 | HPA (`2–10`) | Product listings, search, and category management backed by MongoDB |
| `cart-service` | Deployment | 4002 | 2 | Cart items, quantity updates, and cart totals |
| `order-service` | Deployment | 4003 | 2 | Creating orders and tracking order status |
| `payment-service` | Deployment | 4004 | 2 | Payment processing and payment status updates |
| `notification-service` | Deployment | 4005 | 2 | Sending order and payment notifications |
| `mongodb-0` | StatefulSet | 27017 | 1 | Document database for product catalog data |
| `postgres-0` | StatefulSet | 5432 | 1 | Relational database for users, orders, and payment records |

- **Autoscaling:** `api-gateway-hpa` and `catalog-service-hpa` scale replicas between `2` and `10` based on CPU usage.

## Infrastructure & Deployment Primitives

- **AWS Network & Compute (`terraform/`):** Creates the VPC (`10.0.0.0/16`), public and private subnets, NAT Gateway, Elastic IP, security groups, and three Ubuntu `24.04.5 LTS` `m7i-flex.large` EC2 nodes (`shopitry-k8s-master`, `shopitry-k8s-worker-1`, `shopitry-k8s-worker-2`) with `30 GB` `gp3` root disks in `ap-south-1`.
- **Remote State (`backend.tf`):** Stores state in S3 (`shopitry-terraform-state-bucket`, key `shopitry/prod/terraform.tfstate`). Keep `.tfstate` and `.tfvars` out of Git.
- **Container Runtime & Cluster (`v1.31.14`):** Nodes run `containerd` with `kubeadm`, `kubelet`, and `kubectl`. Calico handles pod-to-pod networking, and `ingress-nginx` exposes HTTPS on NodePort `32152`.
- **CI Pipeline (`.github/workflows/ci.yml`):** Runs matrix build and test jobs on pushes to `main`, checks SonarQube quality gates (`:9000`), and pushes images to Docker Hub (`shivamgupta898/shopitry-*`).
- **GitOps & Monitoring (`ArgoCD v3.6.1` + `Datadog`):** ArgoCD watches `main` and applies manifests from `k8s/` into `shopitry`. Datadog agents collect node CPU/memory and container metrics.

## Continuous Integration (GitHub Actions)

```text
  [Code Push -> main]
            |
            v
    [GitHub Actions (ci.yml)]
            |
            +---> Run build & test matrix jobs
            |
            +---> Check SonarQube quality gate
            |
            v
    [Push Images -> Docker Hub (shivamgupta898/shopitry-*)]
```

When I push code to `main`, the GitHub Actions workflow (`ci.yml`) runs matrix jobs across the Shopitry services to build code, run tests, and check SonarQube quality gates. Once checks pass, the pipeline builds container images and pushes them to Docker Hub under `shivamgupta898` (`shopitry-*`), keeping verified images ready for deployment.

## Continuous Delivery (ArgoCD & Kubernetes)

```text
  [Docker Hub: shivamgupta898/shopitry-*]
                      |
                      v
         [ArgoCD (v3.6.1 Auto-Sync)]
                      |
                      v
       [Kubernetes shopitry Namespace]
         |-- Deployments & StatefulSets
         |-- NGINX Ingress & HPA (2-10)
                      |
                      v
       [Datadog Hosts, Metrics & Containers]
```

For continuous delivery, ArgoCD (`v3.6.1`) watches the `main` branch and reconciles the Kubernetes manifests in the `shopitry` namespace automatically so the cluster matches Git. Deployments, StatefulSets, Ingress routing, and Horizontal Pod Autoscalers (`api-gateway-hpa` and `catalog-service-hpa`) stay updated, while Datadog tracks worker hosts, metrics, and containers after each change.

## Production Deployment Guide

### 1. Provision AWS Infrastructure with Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Update region, key_name, and required variables in terraform.tfvars

terraform init
terraform fmt
terraform validate
terraform plan
```

<span style="color: #6b7280;">After terraform plan, check if everything was okay.</span>

```bash
terraform apply
```

*Check:* Confirm the three EC2 instances are running in your dedicated region and `terraform.tfstate` is updated in your remote state bucket.

### 2. Cluster Setup & Ingress

```bash
# SSH into the master node, initialize the control plane, and set up kubeconfig for kubectl
# Install Calico pod networking, join worker nodes to the cluster, and deploy ingress-nginx

# Verify nodes and ingress controller
kubectl get nodes -o wide
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

*Check:* Nodes show `Ready` and `ingress-nginx-controller` is running with NodePort `32152` mapped to HTTPS (`443`).

### 3. Application Rollout via ArgoCD

```bash
# Create the shopitry namespace and apply your ArgoCD application manifest pointing to k8s/
# Watch ArgoCD sync the manifests and pull images from Docker Hub into the cluster

# Verify ArgoCD application and shopitry workloads
kubectl get applications -n argocd
kubectl get pods,svc,statefulset,hpa -n shopitry
```

*Check:* ArgoCD shows `Synced` and `Healthy`, and deployments, StatefulSets (`mongodb-0`, `postgres-0`), and HPAs in `shopitry` are running.

### 4. Verify Endpoints

```bash
curl -kI https://<k8s-master-public-ip>:32152/
curl -kI https://<k8s-master-public-ip>:32152/admin
curl -kI https://<k8s-master-public-ip>:32152/api/health
curl -I http://<k8s-master-public-ip>:9000/
```

*Check:* Storefront (`/`), admin (`/admin`), and gateway (`/api`) respond through ingress, and SonarQube responds on port `9000`.

## Repository Structure

```text
shopitry/
|-- .github/
|-- backend/
|-- frontend/
|   |-- admin-dashboard/
|   `-- storefront/
|-- k8s/
|-- screenshots/
|-- terraform/
|-- tests/
|-- docker-compose.yml
`-- README.md
```

## Verification & Screenshots

- Infrastructure & Kubernetes Cluster (`screenshots/`)
- S3 Remote Terraform State (`screenshots/s3-terraform-state.png`)
- CI/CD, Docker Hub & SonarQube (`screenshots/`)
- ArgoCD GitOps (`screenshots/`)
- Datadog Observability (`screenshots/`)
- Live Storefront & Admin UI (`screenshots/`)

Managed by Shivam Gupta
