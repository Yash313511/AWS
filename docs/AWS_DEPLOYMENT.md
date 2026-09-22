# AWS Deployment Guide — Secure File Exchange

Complete step-by-step guide to deploy the Cloud-Based Secure File Exchange system on AWS (ap-south-1 Mumbai).

---

## Prerequisites

1. An **AWS Account** (free tier eligible)
2. **AWS CLI v2** installed on your computer
3. Your project working locally (backend tests passing, frontend building)

---

## Step 0: Install and Configure AWS CLI

```bash
# Install AWS CLI on macOS
brew install awscli

# Verify
aws --version

# Configure with your IAM credentials
aws configure
#   AWS Access Key ID:     <your-access-key>
#   AWS Secret Access Key: <your-secret-key>
#   Default region name:   ap-south-1
#   Default output format: json

# Verify your identity
aws sts get-caller-identity
```

---

## Step 1: Create IAM User for the Application

> **Why**: Least-privilege access. The app only needs S3 read/write on one bucket.

### 1.1 Create IAM Policy

```bash
aws iam create-policy \
  --policy-name SecureFileExchangeS3Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "S3BucketAccess",
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::secure-file-exchange-mumbai-YOUR_ACCOUNT_ID",
          "arn:aws:s3:::secure-file-exchange-mumbai-YOUR_ACCOUNT_ID/*"
        ]
      }
    ]
  }'
```

> **Note**: Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID (find it via `aws sts get-caller-identity`).

### 1.2 Create IAM User

```bash
aws iam create-user --user-name secure-file-exchange-app

# Attach the policy
aws iam attach-user-policy \
  --user-name secure-file-exchange-app \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/SecureFileExchangeS3Policy

# Generate access keys
aws iam create-access-key --user-name secure-file-exchange-app
```

> **SAVE the output** — you'll get `AccessKeyId` and `SecretAccessKey`. You'll need these for Step 4.

---

## Step 2: Create Private S3 Bucket

### 2.1 Create the Bucket

```bash
# Create bucket in ap-south-1
aws s3api create-bucket \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1
```

### 2.2 Block ALL Public Access

```bash
aws s3api put-public-access-block \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 2.3 Enable Server-Side Encryption

```bash
aws s3api put-bucket-encryption \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'
```

### 2.4 Enable Versioning (optional but recommended)

```bash
aws s3api put-bucket-versioning \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID \
  --versioning-configuration Status=Enabled
```

### 2.5 Verify Bucket Configuration

```bash
# List your bucket
aws s3 ls | grep secure-file

# Check public access block
aws s3api get-public-access-block \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID

# Check encryption
aws s3api get-bucket-encryption \
  --bucket secure-file-exchange-mumbai-YOUR_ACCOUNT_ID
```

---

## Step 3: Create Amazon RDS PostgreSQL Database

### 3.1 Create a DB Subnet Group (if using VPC)

> Skip this if using default VPC — RDS creates one automatically.

### 3.2 Create Security Group for RDS

```bash
# Create security group
aws ec2 create-security-group \
  --group-name secure-file-exchange-rds-sg \
  --description "Security group for Secure File Exchange RDS" \
  --region ap-south-1

# Note the GroupId returned (e.g., sg-0abc123def456)

# Allow PostgreSQL traffic from your EC2 security group (or your IP for now)
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP/32     # Replace with your IP or EC2 security group
```

### 3.3 Launch RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier secure-file-exchange-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username dbadmin \
  --master-user-password YOUR_STRONG_DB_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name file_exchange_prod \
  --vpc-security-group-ids sg-YOUR_RDS_SG_ID \
  --availability-zone ap-south-1a \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --storage-encrypted \
  --region ap-south-1
```

> **Important**: Use `--no-publicly-accessible` so only your EC2 can reach the database.

### 3.4 Wait for RDS to be Available

```bash
# Check status (takes 5-10 minutes)
aws rds describe-db-instances \
  --db-instance-identifier secure-file-exchange-db \
  --query 'DBInstances[0].DBInstanceStatus'

# When status is "available", get the endpoint
aws rds describe-db-instances \
  --db-instance-identifier secure-file-exchange-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

> This gives you the RDS hostname (e.g., `secure-file-exchange-db.xxxxxxxx.ap-south-1.rds.amazonaws.com`)

### 3.5 Build Your DATABASE_URL

```
postgresql://dbadmin:YOUR_STRONG_DB_PASSWORD@secure-file-exchange-db.xxxxxxxx.ap-south-1.rds.amazonaws.com:5432/file_exchange_prod
```

---

## Step 4: Connect Your Local App to AWS

### 4.1 Update `backend/.env`

```env
# Server Configuration
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:5173

# Database → point to your RDS instance
DATABASE_URL=postgresql://dbadmin:YOUR_STRONG_DB_PASSWORD@secure-file-exchange-db.xxxxxxxx.ap-south-1.rds.amazonaws.com:5432/file_exchange_prod

# AWS S3 Storage
AWS_REGION=ap-south-1
AWS_S3_BUCKET=secure-file-exchange-mumbai-YOUR_ACCOUNT_ID
AWS_ACCESS_KEY_ID=AKIA...your-key...
AWS_SECRET_ACCESS_KEY=your-secret-key-here

# Storage Driver → switch to S3
STORAGE_DRIVER=s3

# Security
PIN_PEPPER=CHANGE_THIS_TO_A_REAL_RANDOM_SECRET_IN_PRODUCTION
MAX_FILE_SIZE_MB=100
PRESIGNED_URL_EXPIRY_SECONDS=60
BRUTE_FORCE_MAX_ATTEMPTS=5
BRUTE_FORCE_LOCKOUT_MINUTES=15
```

### 4.2 Run Database Migration Against RDS

```bash
cd backend
npm run db:migrate
# Should print: [MIGRATION] Migration completed successfully.
```

### 4.3 Test the Full Stack with AWS

```bash
# Start backend
npm run dev

# In another terminal, test upload
curl -F "file=@../project-report.pdf" http://localhost:5001/api/files/upload
# Should return transferCode + pin

# Verify S3 object was created
aws s3 ls s3://secure-file-exchange-mumbai-YOUR_ACCOUNT_ID/uploads/ --recursive
```

> At this point your app is running locally but using **real AWS S3** and **real RDS PostgreSQL**.

---

## Step 5: Launch EC2 Instance for Backend

### 5.1 Create Security Group for EC2

```bash
aws ec2 create-security-group \
  --group-name secure-file-exchange-ec2-sg \
  --description "Security group for Secure File Exchange EC2 backend" \
  --region ap-south-1

# Allow SSH (port 22) from your IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_EC2_SG_ID \
  --protocol tcp --port 22 --cidr YOUR_IP/32

# Allow HTTP (port 5001) from anywhere (or restrict to CloudFront IP ranges)
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_EC2_SG_ID \
  --protocol tcp --port 5001 --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_EC2_SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 5.2 Allow EC2 → RDS Connection

```bash
# Add EC2 security group to RDS inbound rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_RDS_SG_ID \
  --protocol tcp --port 5432 \
  --source-group sg-YOUR_EC2_SG_ID
```

### 5.3 Create IAM Instance Profile (so EC2 can access S3 without access keys)

```bash
# Create IAM Role for EC2
aws iam create-role \
  --role-name SecureFileExchangeEC2Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach S3 policy to the role
aws iam attach-role-policy \
  --role-name SecureFileExchangeEC2Role \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/SecureFileExchangeS3Policy

# Attach CloudWatch logs policy
aws iam attach-role-policy \
  --role-name SecureFileExchangeEC2Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name SecureFileExchangeEC2Profile

# Add role to profile
aws iam add-role-to-instance-profile \
  --instance-profile-name SecureFileExchangeEC2Profile \
  --role-name SecureFileExchangeEC2Role
```

### 5.4 Create a Key Pair

```bash
aws ec2 create-key-pair \
  --key-name secure-file-exchange-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/secure-file-exchange-key.pem

chmod 400 ~/.ssh/secure-file-exchange-key.pem
```

### 5.5 Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0f5ee92e2d63afc18 \
  --instance-type t2.micro \
  --key-name secure-file-exchange-key \
  --security-group-ids sg-YOUR_EC2_SG_ID \
  --iam-instance-profile Name=SecureFileExchangeEC2Profile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=secure-file-exchange-backend}]' \
  --region ap-south-1 \
  --count 1
```

> **Note**: `ami-0f5ee92e2d63afc18` is Amazon Linux 2023 in ap-south-1. Check the AWS console for the latest AMI ID if this one is outdated.

### 5.6 Get the EC2 Public IP

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=secure-file-exchange-backend" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

---

## Step 6: Deploy Backend to EC2

### 6.1 SSH into EC2

```bash
ssh -i ~/.ssh/secure-file-exchange-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 6.2 Install Node.js on EC2

```bash
# Install Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Verify
node --version
npm --version
```

### 6.3 Clone & Install the Backend

```bash
# Clone your repo (or upload via scp)
cd ~
git clone <YOUR_REPO_URL> secure-file-exchange
cd secure-file-exchange/backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build
```

### 6.4 Create Production .env on EC2

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://your-domain.com

DATABASE_URL=postgresql://dbadmin:YOUR_DB_PASSWORD@secure-file-exchange-db.xxxxxxxx.ap-south-1.rds.amazonaws.com:5432/file_exchange_prod

AWS_REGION=ap-south-1
AWS_S3_BUCKET=secure-file-exchange-mumbai-YOUR_ACCOUNT_ID
# No access keys needed — EC2 uses IAM Instance Profile role!

STORAGE_DRIVER=s3
PIN_PEPPER=GENERATE_A_STRONG_RANDOM_SECRET_HERE
MAX_FILE_SIZE_MB=100
PRESIGNED_URL_EXPIRY_SECONDS=60
BRUTE_FORCE_MAX_ATTEMPTS=5
BRUTE_FORCE_LOCKOUT_MINUTES=15
EOF
```

### 6.5 Run Database Migration on Production

```bash
npm run db:migrate
```

### 6.6 Install PM2 and Start the Server

```bash
# Install PM2 process manager globally
sudo npm install -g pm2

# Start the server
pm2 start dist/server.js --name secure-file-exchange

# Auto-restart on EC2 reboot
pm2 startup
pm2 save

# Check logs
pm2 logs secure-file-exchange

# Test
curl http://localhost:5001/api/health
```

---

## Step 7: Deploy Frontend to S3 + CloudFront

### 7.1 Build the Frontend for Production

On your local machine:

```bash
cd frontend

# Update API base URL in vite.config.ts for production
# Remove the proxy and update src/services/api.ts baseURL to point to your EC2 backend
```

Update `frontend/src/services/api.ts`:

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://YOUR_EC2_IP_OR_DOMAIN:5001/api'
    : '/api',
  // ...
});
```

Then build:

```bash
npm run build
# Output is in frontend/dist/
```

### 7.2 Create S3 Bucket for Frontend Static Hosting

```bash
aws s3api create-bucket \
  --bucket secure-file-exchange-frontend-YOUR_ACCOUNT_ID \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Enable static website hosting
aws s3 website \
  s3://secure-file-exchange-frontend-YOUR_ACCOUNT_ID/ \
  --index-document index.html \
  --error-document index.html
```

### 7.3 Upload Frontend Build to S3

```bash
# Sync the dist folder
aws s3 sync frontend/dist/ s3://secure-file-exchange-frontend-YOUR_ACCOUNT_ID/ \
  --delete \
  --cache-control "max-age=31536000,public" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp frontend/dist/index.html s3://secure-file-exchange-frontend-YOUR_ACCOUNT_ID/ \
  --cache-control "no-cache,no-store,must-revalidate"
```

### 7.4 Create CloudFront Distribution (optional but recommended)

```bash
aws cloudfront create-distribution \
  --origin-domain-name secure-file-exchange-frontend-YOUR_ACCOUNT_ID.s3.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

> Configure CloudFront via the AWS Console for HTTPS, custom error responses (404 → index.html for SPA routing), and OAI/OAC for private S3 access.

---

## Step 8: Set Up CloudWatch Monitoring

### 8.1 View EC2 Metrics (automatic)

EC2 basic monitoring (CPU, network, disk) is enabled by default. Check in:
**AWS Console → CloudWatch → Metrics → EC2**

### 8.2 Stream Application Logs to CloudWatch

On EC2:

```bash
# Install CloudWatch Agent
sudo yum install -y amazon-cloudwatch-agent

# Create configuration
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ec2-user/.pm2/logs/secure-file-exchange-out.log",
            "log_group_name": "/secure-file-exchange/application",
            "log_stream_name": "{instance_id}/stdout"
          },
          {
            "file_path": "/home/ec2-user/.pm2/logs/secure-file-exchange-error.log",
            "log_group_name": "/secure-file-exchange/application",
            "log_stream_name": "{instance_id}/stderr"
          }
        ]
      }
    }
  }
}
EOF

# Start the agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

### 8.3 Key CloudWatch Events to Monitor

| Event                        | Level | Meaning                        |
|------------------------------|-------|--------------------------------|
| UPLOAD_SUCCESS               | INFO  | File uploaded to S3            |
| TRANSFER_CREATED             | INFO  | Transfer code generated        |
| DOWNLOAD_SUCCESS             | INFO  | Presigned URL issued           |
| TRANSFER_VERIFICATION_FAILED | WARN  | Wrong PIN attempt              |
| RATE_LIMIT_EXCEEDED          | WARN  | Brute-force lockout triggered  |
| UPLOAD_FAILURE               | ERROR | S3 or DB failure               |
| SECURITY_ALERT               | ERROR | Unhandled error                |

---

## Step 9: Configure HTTPS (Production)

### Option A: Use Elastic IP + Nginx + Let's Encrypt on EC2

```bash
# On EC2
sudo yum install -y nginx certbot python3-certbot-nginx

# Allocate and associate Elastic IP via AWS Console

# Configure Nginx as reverse proxy to Node.js
sudo tee /etc/nginx/conf.d/secure-file-exchange.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 105M;
    }
}
EOF

sudo systemctl start nginx
sudo certbot --nginx -d your-domain.com
```

### Option B: Use ACM + CloudFront (for frontend HTTPS)

1. **AWS Console → Certificate Manager** → Request public certificate for your domain
2. Validate via DNS
3. Attach certificate to CloudFront distribution

---

## Summary: AWS Services Used

| Service        | Purpose                                    |
|----------------|--------------------------------------------|
| Amazon S3      | Private file storage + frontend hosting     |
| Amazon RDS     | PostgreSQL database for metadata            |
| Amazon EC2     | Node.js backend server                      |
| AWS IAM        | Least-privilege roles and policies          |
| CloudWatch     | Application logs and EC2 metrics            |
| CloudFront     | (Optional) CDN + HTTPS for frontend         |
| Route 53       | (Optional) Custom domain DNS                |
| ACM            | (Optional) SSL/TLS certificates             |

---

## Quick Reference: All AWS CLI Commands

```bash
# Check what you created
aws s3 ls                                          # List S3 buckets
aws rds describe-db-instances                       # List RDS instances
aws ec2 describe-instances                          # List EC2 instances
aws iam list-users                                  # List IAM users
aws cloudwatch describe-log-groups                  # List CloudWatch log groups

# Cleanup (when done)
aws ec2 terminate-instances --instance-ids i-xxxxx  # Terminate EC2
aws rds delete-db-instance --db-instance-identifier secure-file-exchange-db --skip-final-snapshot
aws s3 rb s3://secure-file-exchange-mumbai-YOUR_ACCOUNT_ID --force
aws iam delete-user --user-name secure-file-exchange-app
```
