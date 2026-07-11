#!/bin/bash
# cloud-init bootstrap for Ampere A1 instance — Static Site Hosting
# Runs on first boot. Installs Nginx and preps static file directories.
# All Docker/LLM dependencies removed after pivot to static infographic map.
set -euxo pipefail

# --- System update ---
dnf update -y

# --- Nginx only (no Docker, no Ollama, no Python) ---
dnf install -y nginx certbot python3-certbot-nginx git

# --- Firewall ---
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# --- Enable Nginx ---
systemctl enable nginx

# --- Create /var/www for frontend static files ---
mkdir -p /var/www/oc-platform

# --- Create deploy user directory ---
mkdir -p /opt/oc-platform

echo "A1 bootstrap complete" > /var/log/a1-bootstrap.done
