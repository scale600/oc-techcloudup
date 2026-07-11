#!/bin/bash
# ============================================================================
# a1-resize.sh — Guide for resizing A1 instance from 2 OCPU → 1 OCPU
# ============================================================================
# The A1.Flex shape allows changing OCPU/RAM without recreating the instance.
#
# Current:  2 OCPU, 12 GB RAM  → 1,488 OCPU-h/month (99.2% of free 1,500h)
# Target:   1 OCPU,  6 GB RAM  →   744 OCPU-h/month (49.6% of free 1,500h)
# Savings:  Eliminates risk of exceeding Always Free limit
#
# ⚠️  PREREQUISITE: Instance must be STOPPED to change shape config.
# ⚠️  The static site will be DOWN during the resize (~2-5 minutes).
# ⚠️  Boot volume and all data are preserved.
#
# Procedure:
#   1. SSH into the VM and verify services
#   2. Stop the instance via OCI Console or CLI
#   3. Edit shape config: 2 OCPU → 1 OCPU, 12 GB → 6 GB
#   4. Start the instance
#   5. Verify Nginx serves the site
#
# The commands below are for reference. Run them manually.
# ============================================================================
set -euo pipefail

INSTANCE_ID="${1:-}"
if [ -z "$INSTANCE_ID" ]; then
    echo "Usage: Read this script — it's a guide, not automation."
    echo ""
    echo "=== Manual Procedure ==="
    echo ""
    echo "1. SSH into the VM and check status:"
    echo "   ssh opc@<vm-ip> 'systemctl status nginx; free -h'"
    echo ""
    echo "2. Stop the instance (via OCI CLI):"
    echo "   oci compute instance action --instance-id <INSTANCE_OCID> --action STOP"
    echo ""
    echo "   Or via OCI Console:"
    echo "   Compute → Instances → oc-public-a1 → Stop"
    echo ""
    echo "3. Edit shape (via OCI CLI):"
    echo "   oci compute instance update \\"
    echo "     --instance-id <INSTANCE_OCID> \\"
    echo "     --shape-config '{\"ocpus\":1,\"memoryInGBs\":6}'"
    echo ""
    echo "   Or via OCI Console:"
    echo "   Compute → Instances → oc-public-a1 → Edit →"
    echo "   Change OCPU to 1, Memory to 6 GB → Save"
    echo ""
    echo "4. Start the instance:"
    echo "   oci compute instance action --instance-id <INSTANCE_OCID> --action START"
    echo ""
    echo "5. Wait 60 seconds, then verify:"
    echo "   curl http://<vm-ip>/health"
    echo "   curl http://oc.techcloudup.com"
    echo ""
    echo "=== End of Guide ==="
    exit 0
fi

# If instance ID provided, show current config
echo "Current config for: $INSTANCE_ID"
oci compute instance get \
    --instance-id "$INSTANCE_ID" \
    --query 'data."shape-config"' \
    2>/dev/null || echo "Could not fetch — check OCID and OCI CLI auth"
