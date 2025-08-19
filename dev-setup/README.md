# 6529seize-frontend — EC2 Setup Guide

This repo includes `dev-setup/run-setup.sh` to bootstrap a fresh EC2 host for a per‑developer staging site at `https://<slug>staging.6529.io`.

---

## What the script does

- Ensures **Node ≥ 20** (keeps 21/22 if present) and **npm ≥ 10**
- Installs **PM2**
- Prompts you and writes **.env** **before** any build (no `.env.sample` used)
- Installs deps, **builds**, and **starts** the app with PM2 (default port **3001**)
- **Optionally** installs **NGINX + Certbot** and configures HTTPS for `https://<slug>staging.6529.io`
- Enables PM2 start on boot (Linux)

> `BASE_ENDPOINT` is **not configurable**; it is set to `https://<slug>staging.6529.io` to match the NGINX vhost.

---

## 1) Launch EC2

- **Region:** eu‑west‑1 (recommended)
- **AMI:** Ubuntu 22.04 LTS
- **Instance type:** t3.large (2 vCPU / 8 GB RAM)
- **Disk:** 30 GB gp3
- **Security Group (inbound):** 22/tcp (SSH), 80/tcp (HTTP), 443/tcp (HTTPS) - best to use ec2-rds-1 + launch-wizard-1

---

## 2) Create DNS (Route 53)

Create an **A record** in the `6529.io` hosted zone **now**, pointing your dev subdomain to the EC2 public IP (or an Elastic IP):

```
<slug>staging.6529.io  →  <EC2_PUBLIC_IP>
```

Example:

```
punk6529staging.6529.io  →  54.12.34.56
```

Doing this **before** running the script lets Certbot succeed on the first pass.  
TTL 60–300s is fine for staging.

---

## 3) SSH into the instance

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## 4) Clone the repo & run the setup

```bash
sudo apt-get update -y && sudo apt-get install -y git
git clone https://github.com/6529-Collections/6529seize-frontend.git
cd 6529seize-frontend
bash dev-setup/run-setup.sh
```

### You’ll be prompted for

- **Developer slug** → sets domain to `https://<slug>staging.6529.io` and proxy port (default **3001**)
- **SEIZE API ENDPOINT** → staging or production
- **ALLOWLIST API ENDPOINT** → staging or production
- **ALCHEMY_API_KEY** → required
- **CW_PROJECT_ID** → required
- **TENOR_API_KEY** → optional (can be empty)
- **NEXTGEN_CHAIN_ID** → `1` (mainnet) or `11155111` (sepolia)
- **MOBILE_APP_SCHEME** → staging or production
- Fixed values written automatically:
  - `CORE_SCHEME=core6529`
  - `IPFS_API_ENDPOINT=https://api-ipfs.6529.io`
  - `IPFS_GATEWAY_ENDPOINT=https://ipfs.6529.io`
  - `BASE_ENDPOINT=https://<slug>staging.6529.io`

The script then installs deps, builds, starts the app with PM2, and **offers** to set up NGINX + HTTPS.

---

## 5) NGINX + HTTPS (Certbot)

If you choose **Yes** when prompted:

- NGINX and Certbot are installed (if missing)
- A vhost for `<slug>staging.6529.io` → `127.0.0.1:<port>` is created
- Certbot obtains a Let’s Encrypt cert and adds HTTPS + redirect
- `.env` is synced to ensure `BASE_ENDPOINT=https://<slug>staging.6529.io`

> If DNS hasn’t propagated yet, the script will skip cert issuance and print the exact Certbot command to run later.

---

## 6) Verify

Visit:

```
https://<slug>staging.6529.io
```

PM2 logs:

```bash
pm2 logs 6529seize
```

---

## 7) Useful commands

```bash
# Process status / logs
pm2 ls
pm2 logs 6529seize

# Restart / stop
pm2 restart 6529seize
pm2 stop 6529seize

# Persist across reboots
pm2 save

# NGINX
sudo nginx -t && sudo systemctl reload nginx

# Test cert renewal
sudo certbot renew --dry-run
```

---

## 9) Troubleshooting

- If build fails due to memory, ensure you used an instance with **≥ 8 GB RAM**.
- If HTTPS fails, confirm the A record resolves (`dig <slug>staging.6529.io +short`) and re-run the Certbot step printed by the script.
- Ensure security group has 80/443 open to the world for public access.

---

## 🔄 Resetting an Environment

If you need to reset your staging/dev box (e.g., wipe the repo, stop PM2, remove the Nginx vhost), use the provided reset script.  
This does **not uninstall Node, PM2, or Nginx** — it just clears the running app and config so you can re-run setup from scratch.

```bash
bash dev-setup/run-reset.sh
```

This will:

- Stop and remove the PM2 process `6529seize`
- Delete the `~/6529seize-frontend` repo
- Remove Nginx config for `6529seize-staging`
- Reload Nginx

It runs safely even on a new EC2 — missing files/services are skipped automatically.
