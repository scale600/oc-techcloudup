#!/bin/bash
# cloud-init bootstrap for Ampere A1 instance
# Runs on first boot. Installs Docker, Nginx, and preps data dirs.
set -euxo pipefail

# --- System update ---
dnf update -y

# --- Docker ---
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git nginx certbot python3-certbot-nginx

systemctl enable --now docker

# --- Firewall ---
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# --- Data directories ---
mkdir -p /data/{ollama,open-webui,wallet,logs,redis}

# --- Pull base images (do in background, not blocking boot) ---
docker pull ollama/ollama:latest &
docker pull ghcr.io/open-webui/open-webui:main &
docker pull redis:7-alpine &

# --- Create /var/www for frontend ---
mkdir -p /var/www/oc-platform

echo "A1 bootstrap complete" > /var/log/a1-bootstrap.done
