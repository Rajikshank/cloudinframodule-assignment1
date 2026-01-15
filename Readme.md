# AWS ECS Fargate Demo Application

> **Developed by Rajikshan**

A complete Node.js application deployed on AWS ECS Fargate with Terraform infrastructure and CI/CD using GitHub Actions.

## 🚀 Features

- Node.js/Express application running on port 8080
- Dockerized application
- AWS ECS Fargate deployment
- Infrastructure as Code using Terraform
- CI/CD pipeline with GitHub Actions
- Integration with AWS services (S3, CloudWatch)
- Application Load Balancer
- Auto-scaling capabilities
- Health check endpoints

## 📋 Prerequisites

- AWS Account
- Docker installed locally
- Terraform >= 1.0
- Node.js >= 18
- GitHub account
- AWS CLI configured

## 🏗️ Architecture

```
┌─────────────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │ (CI/CD)
       ↓
┌─────────────┐
│     ECR     │
│  (Images)   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│         AWS ECS Fargate         │
│  ┌───────────┐   ┌───────────┐ │
│  │  Task 1   │   │  Task 2   │ │
│  └───────────┘   └───────────┘ │
└─────────────┬───────────────────┘
              │
              ↓
       ┌─────────────┐
       │     ALB     │
       └─────────────┘
              │
              ↓
          Internet
```

## 🛠️ Project Structure

```
.
├── app.js                  # Main Node.js application
├── package.json            # Node.js dependencies
├── Dockerfile             # Docker configuration
├── .dockerignore          # Docker ignore rules
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD pipeline
├── terraform/
│   ├── main.tf            # Main Terraform configuration
│   ├── variables.tf       # Terraform variables
│   └── outputs.tf         # Terraform outputs
└── README.md              # This file
```

## 🚀 Getting Started

### 1. Test Application Locally

```bash
# Install dependencies
npm install

# Run the application
npm start

# Test in browser
open http://localhost:8080
```

### 2. Test with Docker Locally

```bash
# Build the Docker image
docker build -t ecs-demo-app .

# Run the container
docker run -p 8080:8080 ecs-demo-app

# Test in browser
open http://localhost:8080
```

### 3. Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the infrastructure
terraform apply

# Note the outputs (ALB DNS, ECR URL, etc.)
```

### 4. Push Initial Image to ECR

```bash
# Get ECR login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t ecs-demo-app .
docker tag ecs-demo-app:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/ecs-demo-app:latest

# Push to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/ecs-demo-app:latest
```

### 5. Configure GitHub Actions

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

**Two ways to authenticate:**

#### Option A: Using IAM User (GitHub Secrets)
1. Create IAM user with programmatic access
2. Attach policies: `AmazonECS_FullAccess`, `AmazonEC2ContainerRegistryFullAccess`
3. Add credentials as GitHub secrets

#### Option B: Using OIDC (Recommended - No long-term credentials)
```hcl
# Add to Terraform
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub": "repo:YOUR-GITHUB-USERNAME/YOUR-REPO-NAME:*"
        }
      }
    }]
  })
}
```

Update `.github/workflows/deploy.yml`:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::YOUR-ACCOUNT-ID:role/github-actions-role
    aws-region: ${{ env.AWS_REGION }}
```

### 6. Deploy via GitHub Actions

```bash
# Commit and push to main branch
git add .
git commit -m "Initial deployment"
git push origin main

# GitHub Actions will automatically:
# 1. Build the Docker image
# 2. Push to ECR
# 3. Update ECS task definition
# 4. Deploy to ECS Fargate
```

## 🔍 Accessing the Application

After deployment, get your application URL:

```bash
cd terraform
terraform output application_url
```

Or from AWS Console:
1. Go to EC2 → Load Balancers
2. Find your ALB
3. Copy the DNS name
4. Visit: `http://<alb-dns-name>`

## 📡 API Endpoints

- `GET /` - Main application page with UI
- `GET /health` - Health check endpoint (returns JSON)
- `GET /s3-buckets` - List S3 buckets (requires IAM permissions)
- `GET /aws-info` - Display AWS environment information

## 🔧 Configuration

### Terraform Variables

Edit `terraform/variables.tf` to customize:

- `aws_region` - AWS region (default: us-east-1)
- `project_name` - Project name (default: ecs-demo-app)
- `fargate_cpu` - CPU units (default: 256)
- `fargate_memory` - Memory in MB (default: 512)
- `app_count` - Number of tasks (default: 2)

### Application Environment Variables

The application uses these environment variables:
- `AWS_REGION` - Set automatically by ECS
- `NODE_ENV` - Set to 'production' in ECS

## 🔒 Security Features

- ECS tasks run with least privilege IAM roles
- Security groups restrict traffic appropriately
- Container runs as non-root user
- Image scanning enabled on ECR
- VPC with public/private subnet architecture
- ALB for SSL termination (add certificate in production)

## 📊 Monitoring

- CloudWatch Logs: `/ecs/ecs-demo-app`
- ECS Container Insights enabled
- ALB health checks configured
- Application health endpoint at `/health`

## 🧹 Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Note:** Make sure to delete ECR images first:
```bash
aws ecr batch-delete-image \
  --repository-name ecs-demo-app \
  --image-ids imageTag=latest
```

## 🛠️ Troubleshooting

### Container fails to start
```bash
# Check ECS service events
aws ecs describe-services --cluster ecs-demo-app-cluster --services ecs-demo-app-service

# Check CloudWatch logs
aws logs tail /ecs/ecs-demo-app --follow
```

### ALB health checks failing
- Ensure security group allows traffic on port 8080
- Verify `/health` endpoint is accessible
- Check CloudWatch logs for application errors

### GitHub Actions failing
- Verify AWS credentials are correct
- Ensure IAM user has necessary permissions
- Check ECR repository exists
- Verify ECS cluster and service names match

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)

## 👨‍💻 Developer

**Rajikshan**

## 📄 License

MIT License

---

**Built with ❤️ by Rajikshan**