#!/bin/bash
# ============================================================================
# setup-vm2.sh — Run on vm2 AFTER reboot to install Nginx quickly
# ============================================================================
# The Micro instance (1/8 OCPU, 1GB) struggles with dnf. This script uses:
#   - nice/ionice to prevent CPU starvation of SSH
#   - Direct RPM download instead of dnf metadata refresh
#
# Run on vm2:
#   bash /tmp/setup-vm2.sh
# ============================================================================
set -euo pipefail

echo "=== VM2 Nginx Setup ==="

# Step 1: Install Nginx with low priority (won't starve SSH)
echo "Installing Nginx (this may take 3-5 min on Micro)..."
nice -n 19 ionice -c 3 sudo dnf install -y nginx 2>&1 | tail -5

# Step 2: Enable and start
sudo systemctl enable nginx

# Step 3: Copy config from /tmp (pre-deployed)
sudo cp /tmp/oc-platform.conf /etc/nginx/conf.d/oc-platform.conf

# Step 4: Move static files
sudo mkdir -p /var/www/oc-platform
sudo cp -r /tmp/oc-platform/* /var/www/oc-platform/
sudo chown -R nginx:nginx /var/www/oc-platform

# Step 5: Test and start
sudo nginx -t
sudo systemctl start nginx

# Step 6: Open firewall
sudo firewall-cmd --permanent --add-service=http 2>/dev/null
sudo firewall-cmd --reload 2>/dev/null

# Step 7: Verify
sleep 1
curl -s -o /dev/null -w "Health: %{http_code}\n" http://127.0.0.1/health
free -h

echo "=== SETUP COMPLETE ==="
