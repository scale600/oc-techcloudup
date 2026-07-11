#!/bin/bash
# ============================================================================
# deploy-a1-watcher.sh — Deploy A1 watcher to the E2.1 VM
# ============================================================================
# Copies the capacity-check script and sets up a cron job that runs every
# 30 minutes. When A1 capacity appears, it provisions automatically and
# triggers migration.
#
# Run from LOCAL machine:
#   ./scripts/deploy-a1-watcher.sh
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_IP="${VM_IP:-<vm-ip-here>}"
SSH_KEY="${HOME}/.ssh/oc-techcloudup"
SSH_OPTS="-o StrictHostKeyChecking=no -i $SSH_KEY"
REMOTE="opc@$VM_IP"

echo "=== Deploying A1 watcher to $VM_IP ==="

# Copy scripts
echo "Copying scripts..."
ssh $SSH_OPTS "$REMOTE" "mkdir -p /opt/oc-platform/scripts/cloud-init"
scp $SSH_OPTS "$SCRIPT_DIR/a1-capacity-check.sh" "$REMOTE:/opt/oc-platform/scripts/"
scp $SSH_OPTS "$SCRIPT_DIR/a1-migration.sh" "$REMOTE:/opt/oc-platform/scripts/"
scp $SSH_OPTS "$SCRIPT_DIR/oci-vars.sh" "$REMOTE:/opt/oc-platform/scripts/"
scp $SSH_OPTS "$SCRIPT_DIR/cloud-init/a1-bootstrap.sh" "$REMOTE:/opt/oc-platform/scripts/cloud-init/"

# Make executable
ssh $SSH_OPTS "$REMOTE" "chmod +x /opt/oc-platform/scripts/*.sh"

# Set up cron (every 30 min)
echo "Setting up cron..."
CRON_LINE="*/30 * * * * /opt/oc-platform/scripts/a1-capacity-check.sh >> /var/log/a1-watcher.log 2>&1"

ssh $SSH_OPTS "$REMOTE" <<CRONEOF
# Ensure OCI env vars are available to cron
if ! grep -q 'OCI_CLI_AUTH' /etc/environment 2>/dev/null; then
    echo 'OCI_CLI_AUTH=instance_principal' | sudo tee -a /etc/environment
fi

# Add cron job if not present
if ! crontab -l 2>/dev/null | grep -q 'a1-capacity-check'; then
    (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
    echo "Cron job added"
else
    echo "Cron job already exists"
fi

# Show current crontab
echo ""
echo "Current crontab:"
crontab -l
CRONEOF

echo ""
echo "=== Deploy complete ==="
echo "Watcher runs every 30 min. Check logs:"
echo "  ssh opc@$VM_IP tail -f /var/log/a1-watcher.log"
echo "  ssh opc@$VM_IP tail -f /var/log/a1-check.log"
echo ""
echo "When A1 is provisioned, /tmp/a1-provisioned.env will be created."
echo "Then run migration manually:"
echo "  ssh opc@$VM_IP 'cd /opt/oc-platform && ./scripts/a1-migration.sh'"
echo ""
echo "Or add auto-migration after capacity check (uncomment in cron):"
echo "  */30 * * * * /opt/oc-platform/scripts/a1-capacity-check.sh && /opt/oc-platform/scripts/a1-migration.sh"
