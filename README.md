# Cloud-Native E-Commerce CI/CD & Kubernetes Pipeline

End-to-end infrastructure and deployment pipeline for a containerized e-commerce backend, running on **Amazon EKS**, provisioned entirely with **Terraform**, and deployed automatically through a **GitHub Actions** CI/CD pipeline with integrated security scanning and cluster observability.

## Architecture

```
Developer push → GitHub Actions
                     │
                     ├─ Build Docker image
                     ├─ Trivy vulnerability scan (fails build on CRITICAL/HIGH CVEs)
                     ├─ Push image → Amazon ECR
                     └─ Deploy → Amazon EKS (rolling update)

AWS Infrastructure (Terraform):
  VPC (public + private subnets across 2 AZs)
    ├─ Internet Gateway / NAT Gateway
    ├─ EKS Cluster + Managed Node Group
    ├─ IAM roles (least-privilege for cluster & nodes)
    ├─ Security Groups (control plane <-> node communication only)
    └─ ECR repository (image scanning on push enabled)

Observability:
  Prometheus + Grafana (via kube-prometheus-stack Helm chart)
    ├─ Node & pod resource metrics
    ├─ Pod restart tracking
    └─ Application HTTP request rate
```

## Tech Stack

| Layer            | Tools                                              |
|------------------|-----------------------------------------------------|
| IaC              | Terraform (AWS provider)                            |
| Container        | Docker (multi-stage build, non-root user)            |
| Orchestration    | Kubernetes on Amazon EKS                             |
| CI/CD            | GitHub Actions (OIDC auth to AWS — no static keys)   |
| Security         | Trivy image scanning, SARIF upload to GitHub Security|
| Observability    | Prometheus, Grafana                                  |

## Repository Structure

```
.
├── terraform/           # VPC, EKS cluster, node group, IAM, security groups, ECR
├── app/                 # Sample Node.js service + Dockerfile
├── k8s/                 # Deployment, Service, Ingress manifests
├── monitoring/          # Prometheus/Grafana Helm values + dashboard JSON
└── .github/workflows/   # CI/CD pipeline definition
```

## Getting Started

### 1. Provision the infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. Configure GitHub Actions secrets
This pipeline authenticates to AWS using **OIDC** (no long-lived access keys). In your repo settings, add:
- `AWS_ROLE_ARN` — an IAM role ARN configured to trust GitHub's OIDC provider, scoped to this repository.

### 3. Push to `main`
The pipeline will automatically:
1. Build the Docker image
2. Scan it with Trivy (blocks the deploy if critical/high vulnerabilities are found)
3. Push to Amazon ECR
4. Roll out the new version to the EKS cluster with zero downtime

### 4. Install monitoring stack
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  -f monitoring/prometheus-values.yaml -n monitoring --create-namespace
```

## Security Notes
- No hardcoded AWS credentials anywhere — GitHub Actions assumes an IAM role via OIDC.
- Container images run as a non-root user with a read-only root filesystem.
- Trivy scan is a **hard gate**: the pipeline fails on CRITICAL/HIGH CVEs before anything reaches production.
- ECR repository has `scan_on_push` enabled for defense-in-depth.

## License
MIT
