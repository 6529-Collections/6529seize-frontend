# 6529seize-frontend — EC2 Setup Guide

This repo includes `scripts/dev-ec2-setup.sh` to bootstrap a fresh EC2 host for staging.

---

## 1. Launch EC2

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t3.large (recommended for build speed; t3.medium may also work if you want cheaper)
- **Disk**: 20 GB gp3
- **Security group**: open ports 22/tcp, 80/tcp, 443/tcp

---

## 2. Connect to your instance

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## 3. Clone this repo

```bash
sudo apt-get update -y && sudo apt-get install -y git
git clone https://github.com/6529-Collections/6529seize-frontend.git
cd 6529seize-frontend
```

---

## 4. Run the setup script

```bash
bash scripts/dev-ec2-setup.sh
```

The script will:

- Ensure Node.js ≥ 20 and npm ≥ 10 (installs if missing)
- Install PM2
- Prompt you for required `.env` values
- Install dependencies
- Build the project
- Start the app via PM2
- Configure NGINX + Certbot if DNS already points to the instance

---

## 5. DNS (if you want HTTPS)

In Route 53, add an A record for your chosen subdomain pointing to your EC2 IP:

```
<slug>staging.6529.io → <EC2_PUBLIC_IP>
```

Once DNS resolves, rerun the setup script and it will provision a Let’s Encrypt certificate.

---

## 6. Environment prompts

When the script runs, you’ll be asked:

- **SEIZE API ENDPOINT**

  1. Staging (https://api.staging.6529.io) [default]
  2. Production (https://api.6529.io)

- **ALLOWLIST API ENDPOINT**

  1. Staging (https://allowlist-api.staging.6529.io) [default]
  2. Production (https://allowlist-api.6529.io)

- **BASE ENDPOINT**

  1. Staging (https://staging.6529.io) [default]
  2. Production (https://6529.io)

- **ALCHEMY_API_KEY** (enter manually)

- **NEXTGEN_CHAIN_ID**

  1. Mainnet (1) [default]
  2. Sepolia (11155111)

- **CW_PROJECT_ID** (enter manually)

- **TENOR_API_KEY** (optional, can be empty)

Other values are fixed:

```
CORE_SCHEME=core6529
MOBILE_APP_SCHEME=mobileStaging6529 (default)
IPFS_API_ENDPOINT=https://api-ipfs.6529.io
IPFS_GATEWAY_ENDPOINT=https://ipfs.6529.io
```

---

## 7. Managing the app

Check PM2 status:

```bash
pm2 list
```

View logs:

```bash
pm2 logs
```

Restart the app:

```bash
pm2 restart seize-frontend
```

---

## 8. Updating code

```bash
cd ~/6529seize-frontend
git pull
bash scripts/dev-ec2-setup.sh
```

---

## 9. Cleanup

To stop everything and remove PM2 processes:

```bash
pm2 delete seize-frontend
```
