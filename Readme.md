# 🚀 AWS ECS Fargate Deployment with CI/CD

> **Developed by Rajikshan**

A production-ready Node.js application deployed on AWS ECS Fargate with complete infrastructure automation using Terraform and CI/CD pipeline via GitHub Actions.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Deployment Guide](#-deployment-guide)
- [API Endpoints](#-api-endpoints)
- [Configuration](#️-configuration)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)
- [Cleanup](#-cleanup)

---

## ✨ Features

### Core Features
- ✅ **Node.js/Express** application on port 8080
- ✅ **Docker** containerization
- ✅ **AWS ECS Fargate** serverless container deployment
- ✅ **Terraform** Infrastructure as Code (IaC)
- ✅ **GitHub Actions** automated CI/CD pipeline
- ✅ **Application Load Balancer** for high availability
- ✅ **Health checks** at container and ALB level

### Advanced Features
- ✅ **Zero-downtime deployments** with rolling updates
- ✅ **Circuit breaker** with automatic rollback
- ✅ **OIDC authentication** (no stored AWS credentials)
- ✅ **Multi-AZ deployment** for high availability
- ✅ **Auto-scaling ready** infrastructure
- ✅ **CloudWatch logging** and monitoring
- ✅ **ECR image scanning** for vulnerabilities
- ✅ **AWS service integration** (S3, IAM)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ↓
              ┌───────────────────────┐
              │  Application Load     │
              │  Balancer (Port 80)   │
              └───────────┬───────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ↓                               ↓
┌─────────────────┐           ┌─────────────────┐
│  ECS Fargate    │           │  ECS Fargate    │
│  Task (AZ-1)    │           │  Task (AZ-2)    │
│  Private Subnet │           │  Private Subnet │
└────────┬────────┘           └────────┬────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ↓
              ┌─────────────────┐
              │  NAT Gateway    │
              └────────┬────────┘
                       │
                       ↓
              ┌─────────────────┐
              │    Internet     │
              └─────────────────┘

CI/CD Pipeline:
GitHub → Actions → ECR → ECS Fargate
```

### Infrastructure Components

**Networking:**
- VPC with public and private subnets (2 AZs)
- Internet Gateway for public subnet
- NAT Gateways for private subnet internet access
- Security groups for ALB and ECS tasks

**Compute:**
- ECS Fargate cluster (official Terraform module)
- ECS service with 2 tasks for high availability
- Task definitions with health checks

**Load Balancing:**
- Application Load Balancer (ALB)
- Target group with health checks
- HTTP listener on port 80

**Container Registry:**
- Amazon ECR with image scanning
- Lifecycle policy (keeps last 10 images)

**Security:**
- IAM roles (task execution + task role)
- OIDC provider for GitHub Actions
- Security groups (least privilege)

**Monitoring:**
- CloudWatch Logs: `/ecs/cloud-inframodule`
- Container health checks
- ALB target health checks

---

## 📦 Prerequisites

Before you begin, ensure you have:

### Required Tools
- **AWS Account** with administrative access
- **Docker Desktop** installed and running
- **Terraform** >= 1.0 ([Install Guide](https://www.terraform.io/downloads))
- **AWS CLI** configured ([Install Guide](https://aws.amazon.com/cli/))
- **Node.js** >= 18 ([Install Guide](https://nodejs.org/))
- **Git** installed
- **GitHub Account**

### Verify Installation

```bash
# Check all tools are installed
terraform version    # Should show v1.0+
aws --version        # Should show aws-cli version
docker --version     # Should show Docker version
node --version       # Should show v18+
git --version        # Should show git version
```

### AWS Configuration

```bash
# Configure AWS CLI with your credentials
aws configure

# Verify credentials work
aws sts get-caller-identity
```

**Save your AWS Account ID** - you'll need it during setup!

---

## 🚀 Quick Start

Follow these steps to get the application running:

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/cloud-inframodule-project.git
cd cloud-inframodule-project
```

### 2️⃣ Test Application Locally

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Run the application
npm start

# Test in browser
# Open: http://localhost:8080
# You should see the application with "Developed by Rajikshan"

# Stop with Ctrl+C
cd ..
```

### 3️⃣ Test with Docker

```bash
cd app

# Build Docker image
docker build -t cloud-inframodule-app .

# Run container
docker run -p 8080:8080 cloud-inframodule-app

# Test in browser
# Open: http://localhost:8080
# Verify it works!

# Stop with Ctrl+C
cd ..
```

✅ **If both tests pass, you're ready to deploy to AWS!**

---

## 📚 Deployment Guide

### Step 1: Deploy Infrastructure with Terraform

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Preview what will be created (~40 resources)
terraform plan

# Deploy infrastructure (takes ~10 minutes)
terraform apply

# Type: yes

# ☕ Take a break while Terraform creates your infrastructure
```

**Save these outputs** (shown after `terraform apply`):

```bash
# View all outputs
terraform output

# Important values:
alb_url = "http://cloud-inframodule-alb-XXXXXXX.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789012.dkr.ecr.us-east-1.amazonaws.com/cloud-inframodule-app"
aws_account_id = "123456789012"
```

### Step 2: Push Initial Image to ECR

**This is REQUIRED before GitHub Actions will work!**

```bash
# Get your ECR repository URL
ECR_REPO=$(terraform output -raw ecr_repository_url)
echo $ECR_REPO

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO

# Should see: "Login Succeeded"

# Build and tag image
cd ../app
docker build -t cloud-inframodule-app:latest .
docker tag cloud-inframodule-app:latest $ECR_REPO:latest

# Push to ECR
docker push $ECR_REPO:latest

# Verify image is in ECR
aws ecr list-images \
  --repository-name cloud-inframodule-app \
  --region us-east-1

# Go back to project root
cd ..
```

### Step 3: Setup GitHub Actions with OIDC

**OIDC is more secure than storing AWS keys!**

#### A. Create OIDC Provider in AWS

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Identity providers** → **Add provider**
3. Configure:
   - Provider type: **OpenID Connect**
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Click **Get thumbprint**
   - Audience: `sts.amazonaws.com`
4. Click **Add provider**

#### B. Create IAM Policy

1. IAM Console → **Policies** → **Create policy**
2. Click **JSON** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPermissions",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:ListImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSPermissions",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "ecs-tasks.amazonaws.com"
        }
      }
    }
  ]
}
```

4. Click **Next**
5. Policy name: `GitHubActionsECSDeployPolicy`
6. Click **Create policy**

#### C. Create IAM Role

1. IAM Console → **Roles** → **Create role**
2. Trusted entity: **Web identity**
3. Identity provider: `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Next**
6. Search and select: `GitHubActionsECSDeployPolicy`
7. Click **Next**
8. Role name: `GitHubActionsECSDeployRole`
9. Click **Create role**

#### D. Update Trust Policy

1. Find role: IAM → Roles → `GitHubActionsECSDeployRole`
2. **Trust relationships** tab → **Edit trust policy**
3. Replace with (update YOUR values):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/cloud-inframodule-project:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

**Replace:**
- `YOUR_AWS_ACCOUNT_ID` → Your 12-digit AWS account ID
- `YOUR_GITHUB_USERNAME` → Your GitHub username (lowercase)

4. Click **Update policy**
5. Copy the **Role ARN** from the top (looks like: `arn:aws:iam::123456789012:role/GitHubActionsECSDeployRole`)

#### E. Add GitHub Secret

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AWS_ROLE_ARN`
5. Secret: Paste your role ARN
6. Click **Add secret**

### Step 4: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "feat: initial deployment with ECS Fargate and GitHub Actions"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/cloud-inframodule-project.git

# Push to main branch (triggers GitHub Actions)
git branch -M main
git push -u origin main
```

### Step 5: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run (takes ~5-8 minutes)

**Expected steps:**
- ✅ Checkout code
- ✅ Configure AWS credentials using OIDC
- ✅ Login to Amazon ECR
- ✅ Build, tag, and push image
- ✅ Download task definition
- ✅ Update task definition
- ✅ Deploy to ECS
- ✅ Deployment Summary

### Step 6: Access Your Application

```bash
# Get your application URL
cd terraform
terraform output alb_url

# Open in browser or test with curl
curl http://$(terraform output -raw alb_dns_name)/health
```

🎉 **Your application is now live on AWS!**

---

## 🌐 API Endpoints

Once deployed, your application has these endpoints:

### Main Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/` | GET | Application homepage | HTML page with UI |
| `/health` | GET | Health check endpoint | JSON: `{"status": "healthy", ...}` |
| `/s3-buckets` | GET | List S3 buckets | JSON: `{"buckets": [...]}` |
| `/aws-info` | GET | AWS environment info | JSON: `{"region": "us-east-1", ...}` |

### Testing Endpoints

```bash
# Get your ALB DNS
ALB_DNS=$(cd terraform && terraform output -raw alb_dns_name)

# Test homepage
curl http://$ALB_DNS/

# Test health check
curl http://$ALB_DNS/health

# Test AWS info
curl http://$ALB_DNS/aws-info

# Test S3 buckets (requires IAM permissions)
curl http://$ALB_DNS/s3-buckets
```

---

## ⚙️ Configuration

### Terraform Variables

Customize your deployment by editing `terraform/variables.tf`:

```hcl
variable "aws_region" {
  default = "us-east-1"  # Change AWS region
}

variable "project_name" {
  default = "cloud-inframodule"  # Change project name
}

variable "app_count" {
  default = 2  # Number of ECS tasks
}

variable "container_port" {
  default = 8080  # Application port
}
```

After changing variables:
```bash
cd terraform
terraform apply
```

### Application Environment Variables

The ECS tasks automatically receive:
- `AWS_REGION` - AWS region (set by Terraform)
- `PORT` - Container port (8080)

Add custom environment variables in `terraform/ecs.tf`:
```hcl
environment = [
  {
    name  = "AWS_REGION"
    value = var.aws_region
  },
  {
    name  = "YOUR_VARIABLE"
    value = "your_value"
  }
]
```

### GitHub Actions Workflow

Modify `.github/workflows/deploy.yml` to customize CI/CD:

```yaml
env:
  AWS_REGION: us-east-1           # Change region
  ECR_REPOSITORY: cloud-inframodule-app
  ECS_SERVICE: cloud-inframodule-service
  ECS_CLUSTER: cloud-inframodule-cluster
```

---

## 📊 Monitoring

### CloudWatch Logs

View application logs:

```bash
# Tail logs in real-time
aws logs tail /ecs/cloud-inframodule --follow --region us-east-1

# View last 1 hour
aws logs tail /ecs/cloud-inframodule --since 1h --region us-east-1

# Search for errors
aws logs tail /ecs/cloud-inframodule --filter-pattern "ERROR" --region us-east-1
```

### ECS Service Status

```bash
# Check service health
aws ecs describe-services \
  --cluster cloud-inframodule-cluster \
  --services cloud-inframodule-service \
  --region us-east-1

# List running tasks
aws ecs list-tasks \
  --cluster cloud-inframodule-cluster \
  --service-name cloud-inframodule-service \
  --region us-east-1
```

### Target Group Health

```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --region us-east-1 \
    --query "TargetGroups[?contains(TargetGroupName, 'cloud-inframodule')].TargetGroupArn" \
    --output text) \
  --region us-east-1
```

### Monitoring in AWS Console

1. **ECS Console**: View cluster, services, and tasks
   - https://console.aws.amazon.com/ecs/
2. **CloudWatch Console**: View logs and metrics
   - https://console.aws.amazon.com/cloudwatch/
3. **EC2 Console**: View load balancer and target groups
   - https://console.aws.amazon.com/ec2/

---

## 🔧 Troubleshooting

### Application Not Accessible

**Problem:** Can't access application via ALB URL

**Solutions:**
```bash
# 1. Check if tasks are running
aws ecs list-tasks \
  --cluster cloud-inframodule-cluster \
  --service-name cloud-inframodule-service \
  --region us-east-1

# 2. Check target health
# Should show "healthy" for both targets
aws elbv2 describe-target-health \
  --target-group-arn YOUR_TARGET_GROUP_ARN

# 3. Check security groups
# ALB SG should allow port 80 from 0.0.0.0/0
# ECS SG should allow port 8080 from ALB SG

# 4. View logs for errors
aws logs tail /ecs/cloud-inframodule --follow
```

### GitHub Actions Failing

**Problem:** Workflow fails with authentication error

**Solutions:**
1. Verify `AWS_ROLE_ARN` secret exists in GitHub
2. Check OIDC provider exists in AWS IAM
3. Verify trust policy has correct GitHub username/repo
4. Ensure IAM role has required permissions

```bash
# Test role exists
aws iam get-role --role-name GitHubActionsECSDeployRole

# View trust policy
aws iam get-role \
  --role-name GitHubActionsECSDeployRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### Tasks Failing Health Checks

**Problem:** ECS tasks start but fail health checks

**Solutions:**
```bash
# 1. Check container logs
aws logs tail /ecs/cloud-inframodule --follow

# 2. Verify health endpoint works
curl http://YOUR_ALB_DNS/health

# 3. Check task definition health check settings
aws ecs describe-task-definition \
  --task-definition cloud-inframodule-task \
  --query 'taskDefinition.containerDefinitions[0].healthCheck'
```

### Deployment Takes Too Long

**Problem:** GitHub Actions waits forever during deployment

**Solution:** Already optimized! But if still slow:

1. Check current health check settings:
```bash
cd terraform
terraform show | grep -A 10 health_check
```

2. Verify deployment is progressing:
```bash
aws ecs describe-services \
  --cluster cloud-inframodule-cluster \
  --services cloud-inframodule-service \
  --query 'services[0].events[0:5]'
```

### ECR Push Fails

**Problem:** Can't push Docker image to ECR

**Solutions:**
```bash
# 1. Verify ECR repository exists
aws ecr describe-repositories \
  --repository-names cloud-inframodule-app \
  --region us-east-1

# 2. Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ECR_URL

# 3. Check IAM permissions
aws ecr get-authorization-token --region us-east-1
```

### Need More Help?

1. Check CloudWatch logs first
2. Review GitHub Actions logs
3. Check ECS service events
4. Verify all resources exist in AWS Console

---

## 🧹 Cleanup

**⚠️ Important:** This will delete all AWS resources and stop any charges.

### Step 1: Empty ECR Repository

```bash
# List images
aws ecr list-images \
  --repository-name cloud-inframodule-app \
  --region us-east-1

# Delete all images
aws ecr batch-delete-image \
  --repository-name cloud-inframodule-app \
  --image-ids "$(aws ecr list-images \
    --repository-name cloud-inframodule-app \
    --region us-east-1 \
    --query 'imageIds[*]' \
    --output json)" \
  --region us-east-1 || true
```

### Step 2: Destroy Infrastructure

```bash
cd terraform

# Destroy all resources
terraform destroy

# Type: yes

# This removes:
# - ECS cluster, services, tasks
# - Load balancer and target groups
# - NAT gateways ($$)
# - VPC and all networking
# - ECR repository
# - CloudWatch log groups
# - IAM roles (created by Terraform)
```

### Step 3: Manual Cleanup (if needed)

If Terraform destroy fails, manually delete:

1. **OIDC Provider**: IAM → Identity providers → Delete
2. **GitHub Actions Role**: IAM → Roles → `GitHubActionsECSDeployRole` → Delete
3. **GitHub Actions Policy**: IAM → Policies → `GitHubActionsECSDeployPolicy` → Delete

---

## 💰 Cost Estimate

Approximate monthly costs (us-east-1, 2 tasks running 24/7):

| Service | Cost |
|---------|------|
| ECS Fargate (2 tasks, 0.25 vCPU, 0.5 GB) | ~$15 |
| Application Load Balancer | ~$16 |
| NAT Gateways (2 × 0.045/hour) | ~$65 |
| Data Transfer | ~$5 |
| **Total** | **~$100/month** |

**Cost Optimization Tips:**
- Use 1 NAT Gateway instead of 2 (saves ~$32/month)
- Use Fargate Spot for 70% discount (already configured!)
- Delete resources when not needed
- Use AWS Free Tier where applicable

---

## 📚 Additional Resources

### AWS Documentation
- [Amazon ECS](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/userguide/what-is-fargate.html)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Amazon ECR](https://docs.aws.amazon.com/ecr/)

### Terraform Documentation
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Module](https://registry.terraform.io/modules/terraform-aws-modules/ecs/aws/latest)

### GitHub Actions
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

### Docker
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)

---



## 👨‍💻 Developer

**AA1868-Rajikshan**

Cloud Infrastructure Design Assignment  
January 2026

---

## 📄 License

MIT License - feel free to use this project for learning and educational purposes.

---

## 🎯 Project Checklist

Use this checklist to track your progress:

### Initial Setup
- [ ] AWS CLI configured
- [ ] Terraform installed
- [ ] Docker installed and running
- [ ] Node.js installed
- [ ] GitHub account ready

### Local Testing
- [ ] Application runs locally (npm start)
- [ ] Docker container works locally
- [ ] Health endpoint returns 200 OK

### AWS Deployment
- [ ] Terraform infrastructure deployed
- [ ] Initial image pushed to ECR
- [ ] ALB URL accessible

### GitHub Actions
- [ ] OIDC provider created
- [ ] IAM policy created
- [ ] IAM role created with trust policy
- [ ] GitHub secret `AWS_ROLE_ARN` added
- [ ] Workflow runs successfully

### Verification
- [ ] Application accessible via ALB URL
- [ ] All API endpoints working
- [ ] Health checks passing
- [ ] Logs visible in CloudWatch
- [ ] Screenshots captured

### Documentation
- [ ] README updated
- [ ] Architecture diagram included
- [ ] Deployment instructions clear
- [ ] Troubleshooting guide helpful

---

**Built with ❤️ by Rajikshan**
