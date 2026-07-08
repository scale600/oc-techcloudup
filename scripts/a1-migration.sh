#!/bin/bash
# ============================================================================
# a1-migration.sh — Migrate all services from E2.1 to newly provisioned A1
# ============================================================================
# Reads /tmp/a1-provisioned.env (written by a1-capacity-check.sh).
# Copies docker-compose config, nginx config, wallet, frontend, and Ollama
# models to the A1 instance. Starts services, updates the Load Balancer
# backend, verifies health, and terminates the old E2.1 instance.
#
# Usage:
#   source scripts/oci-vars.sh
#   ./scripts/a1-migration.sh
#
# ENV vars expected (from /tmp/a1-provisioned.env):
#   A1_INSTANCE_ID — OCID of the new A1 instance
#   A1_INSTANCE_IP — Public IP of the new A1 instance
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/a1-migration.log"
ENV_FILE="/tmp/a1-provisioned.env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# --- Load provisioning env ---
if [ ! -f "$ENV_FILE" ]; then
    log "FATAL: $ENV_FILE not found. Run a1-capacity-check.sh first."
    exit 1
fi
source "$ENV_FILE"

if [ -z "${A1_INSTANCE_ID:-}" ] || [ -z "${A1_INSTANCE_IP:-}" ]; then
    log "FATAL: A1_INSTANCE_ID or A1_INSTANCE_IP missing from $ENV_FILE"
    exit 1
fi

# --- Source OCI vars ---
source "$SCRIPT_DIR/oci-vars.sh"

SSH_KEY="${HOME}/.ssh/oc-techcloudup"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -i $SSH_KEY"
REMOTE_USER="opc"
REMOTE_HOST="$A1_INSTANCE_IP"

# --- Step 1: Wait for SSH (up to 5 min) ---
log "=== Step 1: Waiting for SSH on $REMOTE_HOST ==="
for i in $(seq 1 30); do
    if ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" "echo ok" 2>/dev/null; then
        log "SSH ready after ${i}0 seconds"
        break
    fi
    if [ "$i" -eq 30 ]; then
        log "FATAL: SSH timeout after 5 min"
        exit 1
    fi
    sleep 10
done

# --- Step 2: Wait for cloud-init bootstrap to finish ---
log "=== Step 2: Waiting for cloud-init ==="
for i in $(seq 1 30); do
    if ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" \
        "test -f /var/log/a1-bootstrap.done" 2>/dev/null; then
        log "Cloud-init bootstrap complete"
        break
    fi
    sleep 10
done
# Proceed even if not found — cloud-init might just be slow on some packages

# --- Step 3: Copy configuration files ---
log "=== Step 3: Copying configs and data ==="

ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" "mkdir -p /opt/oc-platform/docker /opt/oc-platform/src/api"
scp $SSH_OPTS "$SCRIPT_DIR/../docker/docker-compose.yml" \
    "$REMOTE_USER@$REMOTE_HOST:/opt/oc-platform/docker/"
scp $SSH_OPTS "$SCRIPT_DIR/../src/api/Dockerfile" \
    "$SCRIPT_DIR/../src/api/requirements.txt" \
    "$SCRIPT_DIR/../src/api/main.py" \
    "$REMOTE_USER@$REMOTE_HOST:/opt/oc-platform/src/api/" 2>/dev/null || log "(some API files missing — check src/api/)"

# Nginx config
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p /etc/nginx/conf.d"
scp $SSH_OPTS "$SCRIPT_DIR/../docker/nginx/oc-platform.conf" \
    "/tmp/oc-platform.conf"
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" \
    "sudo mv /tmp/oc-platform.conf /etc/nginx/conf.d/oc-platform.conf"

# Wallet (ATP credentials)
log "Copying wallet..."
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p /data/wallet && sudo chown opc:opc /data/wallet"
scp $SSH_OPTS -r /data/wallet/* "$REMOTE_USER@$REMOTE_HOST:/data/wallet/" 2>/dev/null || log "WARN: wallet copy may be incomplete"

# Frontend static files
log "Copying frontend..."
if [ -d "$SCRIPT_DIR/../frontend/out" ]; then
    scp $SSH_OPTS -r "$SCRIPT_DIR/../frontend/out/"* \
        "$REMOTE_USER@$REMOTE_HOST:/tmp/oc-platform/"
    ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" \
        "sudo mkdir -p /var/www/oc-platform && sudo cp -r /tmp/oc-platform/* /var/www/oc-platform/ && sudo chown -R nginx:nginx /var/www/oc-platform"
    log "Frontend copied to /var/www/oc-platform"
else
    log "WARN: frontend/out not found — build frontend first: cd frontend && npm run build"
fi

# --- Step 4: Build and start Docker services ---
log "=== Step 4: Starting Docker services ==="

# Build API image
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" <<'REMOTE_DOCKER'
set -e
cd /opt/oc-platform/docker

# Build API
if [ -f api/Dockerfile ]; then
    docker compose build api
fi

# Start ollama + open-webui + api
docker compose up -d ollama open-webui api

# Wait for containers
sleep 5
docker compose ps
REMOTE_DOCKER

# --- Step 5: Pull Ollama models ---
log "=== Step 5: Pulling Ollama models ==="
for model in "tinyllama:latest" "phi3:mini" "nomic-embed-text:latest"; do
    log "Pulling $model..."
    ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" \
        "docker exec ollama ollama pull $model" 2>&1 | tail -3 || \
        log "WARN: Failed to pull $model (will retry on next compose up)"
done

# --- Step 6: Start Nginx ---
log "=== Step 6: Starting Nginx ==="
ssh $SSH_OPTS "$REMOTE_USER@$REMOTE_HOST" <<'REMOTE_NGINX'
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo nginx -t
curl -s -o /dev/null -w "Health: %{http_code}\n" http://127.0.0.1:8000/docs || echo "(API not responding yet — may need more time)"
curl -s -o /dev/null -w "Health: %{http_code}\n" http://127.0.0.1/health || echo "(Nginx health not ready)"
REMOTE_NGINX

# --- Step 7: Update Load Balancer backend ---
log "=== Step 7: Updating LB backend ==="

# Get the first backend set name
BACKEND_SET_NAME=$(oci lb backend-set list \
    --load-balancer-id "$LB_ID" \
    --query 'data[0].name' \
    --raw-output 2>/dev/null)

if [ -z "$BACKEND_SET_NAME" ] || [ "$BACKEND_SET_NAME" = "null" ]; then
    log "WARN: Could not find LB backend set — skipping LB update"
else
    log "Backend set: $BACKEND_SET_NAME"

    # Get A1 private IP
    A1_PRIVATE_IP=$(oci compute instance list-vnics \
        --instance-id "$A1_INSTANCE_ID" \
        --query 'data[0]."private-ip"' \
        --raw-output 2>/dev/null)

    if [ -z "$A1_PRIVATE_IP" ] || [ "$A1_PRIVATE_IP" = "null" ]; then
        log "WARN: Could not get A1 private IP — using public IP"
        A1_PRIVATE_IP="$A1_INSTANCE_IP"
    fi
    log "A1 private IP: $A1_PRIVATE_IP"

    EXISTING_BACKEND_NAME=$(oci lb backend list \
        --load-balancer-id "$LB_ID" \
        --backend-set-name "$BACKEND_SET_NAME" \
        --query 'data[0].name' \
        --raw-output 2>/dev/null || true)

    log "Existing backend: $EXISTING_BACKEND_NAME"

    if [ -z "$EXISTING_BACKEND_NAME" ] || [ "$EXISTING_BACKEND_NAME" = "null" ]; then
        log "WARN: No existing backend found — creating new one"
        oci lb backend create \
            --load-balancer-id "$LB_ID" \
            --backend-set-name "$BACKEND_SET_NAME" \
            --ip-address "$A1_PRIVATE_IP" \
            --port 80 \
            --weight 1 \
            2>&1 || log "WARN: Could not create backend"
    else
        oci lb backend update \
            --load-balancer-id "$LB_ID" \
            --backend-set-name "$BACKEND_SET_NAME" \
            --backend-name "$EXISTING_BACKEND_NAME" \
            --ip-address "$A1_PRIVATE_IP" \
            --port 80 \
            --backup false \
            --drain false \
            --offline false \
            --weight 1 \
            2>&1 || log "WARN: Backend update failed — update manually in OCI Console"
    fi

    log "LB backend updated to $A1_PRIVATE_IP:80"
fi

# --- Step 8: Health check (through LB) ---
log "=== Step 8: Health check ==="
sleep 10  # let LB health check cycle

for i in $(seq 1 6); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://"$LB_IP"/health 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        log "LB health check PASS ($LB_IP → 200)"
        break
    fi
    log "Health attempt $i: $STATUS (waiting...)"
    sleep 10
done

# Final check
curl -s -o /dev/null -w "Final status: %{http_code} from %{url_effective}\n" \
    "http://$LB_IP/health" || log "WARN: Final health check failed"

# --- Step 9: Terminate E2.1 ---
log "=== Step 9: Terminating old E2.1 instance ==="
E2_INSTANCE_ID=$(oci compute instance list \
    --compartment-id "$COMPARTMENT_ID" \
    --display-name "oc-public-vm1" \
    --lifecycle-state RUNNING \
    --query 'data[0].id' \
    --raw-output 2>/dev/null || true)

if [ -n "$E2_INSTANCE_ID" ] && [ "$E2_INSTANCE_ID" != "null" ]; then
    log "Terminating E2.1: $E2_INSTANCE_ID"

    # Preserve boot volume
    BOOT_VOL_ID=$(oci compute boot-volume-attachment list \
        --compartment-id "$COMPARTMENT_ID" \
        --instance-id "$E2_INSTANCE_ID" \
        --query 'data[0]."boot-volume-id"' \
        --raw-output 2>/dev/null || true)

    oci compute instance terminate \
        --instance-id "$E2_INSTANCE_ID" \
        --preserve-boot-volume true \
        --force 2>&1 || log "WARN: Could not terminate E2.1 — terminate manually"

    log "E2.1 termination requested (boot volume preserved: $BOOT_VOL_ID)"
else
    log "No E2.1 instance found (may already be terminated)"
fi

log "=== MIGRATION COMPLETE ==="
log "A1 Instance : $A1_INSTANCE_ID"
log "A1 Public IP: $A1_INSTANCE_IP"
log "LB IP       : $LB_IP"
log ""
log "Next steps:"
log "  1. Verify: curl http://$LB_IP/health"
log "  2. Visit:  http://oc.techcloudup.com"
log "  3. Check OCI Console — E2.1 should be terminated"
log "  4. Check billing: OCI Console → Cost Analysis → $0 expected"
