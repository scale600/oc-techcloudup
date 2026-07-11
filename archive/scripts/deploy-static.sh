#!/bin/bash
# ============================================================================
# deploy-static.sh — Deploy static frontend to A1 VM (post-chatbot pivot)
# ============================================================================
# Simplified from a1-migration.sh after removing all backend services.
# Only copies static files + nginx config, then reloads nginx.
#
# Usage:
#   source scripts/oci-vars.sh
#   ./scripts/deploy-static.sh
#
# ENV vars expected (from /tmp/a1-provisioned.env or set manually):
#   A1_INSTANCE_IP — Public IP of the A1 instance
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/a1-deploy.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# --- Load provisioning env (if available) ---
ENV_FILE="/tmp/a1-provisioned.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Allow override via env
TARGET_IP="${A1_INSTANCE_IP:-${VM_IP:-}}"
if [ -z "$TARGET_IP" ]; then
    echo "Usage: VM_IP=<ip> $0"
    echo "  or set A1_INSTANCE_IP in /tmp/a1-provisioned.env"
    exit 1
fi

SSH_KEY="${HOME}/.ssh/oc-techcloudup"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -i $SSH_KEY"
REMOTE_USER="opc"
REMOTE_HOST="$TARGET_IP"

log "=== Deploying static site to $REMOTE_HOST ==="

# --- Step 1: Wait for SSH ---
log "Waiting for SSH..."
for i in $(seq 1 30); do
    if ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" "echo ok" 2>/dev/null; then
        log "SSH ready after ${i}0 seconds"
        break
    fi
    if [ "$i" -eq 30 ]; then
        log "FATAL: SSH timeout"
        exit 1
    fi
    sleep 10
done

# --- Step 2: Copy Nginx config ---
log "Copying Nginx config..."
scp $SSH_OPTS "$SCRIPT_DIR/../docker/nginx/oc-platform.conf" \
    "/tmp/oc-platform.conf"
ssh $SSH_OPTS "$REMOTE_USER" \
    "sudo mv /tmp/oc-platform.conf /etc/nginx/conf.d/oc-platform.conf && sudo nginx -t"

# --- Step 3: Copy frontend static files ---
log "Copying frontend static files..."
FRONTEND_OUT="$SCRIPT_DIR/../frontend/out"
if [ ! -d "$FRONTEND_OUT" ]; then
    log "FATAL: frontend/out not found — run: cd frontend && npm run build"
    exit 1
fi

scp $SSH_OPTS -r "$FRONTEND_OUT/"* "$REMOTE_USER:/tmp/oc-platform/"
ssh $SSH_OPTS "$REMOTE_USER" \
    "sudo mkdir -p /var/www/oc-platform && sudo cp -r /tmp/oc-platform/* /var/www/oc-platform/ && sudo chown -R nginx:nginx /var/www/oc-platform"

# --- Step 4: Reload Nginx ---
log "Reloading Nginx..."
ssh $SSH_OPTS "$REMOTE_USER" \
    "sudo systemctl reload nginx"

# --- Step 5: Stop old Docker services (if running) ---
log "Stopping legacy Docker services..."
ssh $SSH_OPTS "$REMOTE_USER" <<'REMOTE_CLEANUP'
# Stop and remove old containers if docker is installed
if command -v docker &> /dev/null; then
    docker stop ollama open-webui oc-api redis 2>/dev/null || true
    docker rm ollama open-webui oc-api redis 2>/dev/null || true
    echo "Legacy containers cleaned up"
fi
REMOTE_CLEANUP

# --- Step 6: Health check ---
log "Health check..."
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$TARGET_IP/health" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
    log "✓ Deploy successful — health check: 200"
else
    log "⚠ Health check returned $STATUS — verify manually"
fi

log "=== Deploy complete ==="
log "Visit: http://oc.techcloudup.com"
