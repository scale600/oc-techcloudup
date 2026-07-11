#!/bin/bash
# ============================================================================
# oci-cleanup.sh — Remove unnecessary OCI resources to hit $0/month
# ============================================================================
# Removes resources obsoleted by the static-site pivot:
#   1. ATP Database (ocpublic) — no longer queried
#   2. Flexible Load Balancer — single VM doesn't need LB
#
# ⚠️  SAFETY: This script is read-only by default. Use --execute to apply.
# ⚠️  PREREQUISITE: OCI CLI configured with instance_principal or API key.
#
# Usage:
#   source scripts/oci-vars.sh
#   ./scripts/oci-cleanup.sh             # dry-run: show what would be removed
#   ./scripts/oci-cleanup.sh --execute   # actually remove resources
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source OCI vars if available
if [ -f "$SCRIPT_DIR/oci-vars.sh" ]; then
    source "$SCRIPT_DIR/oci-vars.sh"
fi

: "${COMPARTMENT_ID:?Set COMPARTMENT_ID in oci-vars.sh or env}"
: "${LB_ID:?Set LB_ID in oci-vars.sh or env (skip LB cleanup by setting LB_ID=skip)}"

EXECUTE=false
if [ "${1:-}" = "--execute" ]; then
    EXECUTE=true
    echo "⚠️  EXECUTE MODE — resources will be permanently removed!"
    echo "Press Ctrl-C within 5 seconds to cancel..."
    sleep 5
else
    echo "📋 DRY-RUN MODE — use --execute to actually remove resources"
fi
echo ""

# ============================================================================
# 1. ATP Database — find and remove
# ============================================================================
echo "=== ATP Database ==="
ATP_ID=$(oci db autonomous-database list \
    --compartment-id "$COMPARTMENT_ID" \
    --query "data[?\"db-name\"=='ocpublic'].id | [0]" \
    --raw-output 2>/dev/null || true)

if [ -z "$ATP_ID" ] || [ "$ATP_ID" = "null" ]; then
    echo "  No ATP database 'ocpublic' found — already removed."
else
    echo "  Found: $ATP_ID"
    if $EXECUTE; then
        echo "  Deleting ATP database..."
        oci db autonomous-database delete \
            --autonomous-database-id "$ATP_ID" \
            --force 2>&1
        echo "  ✓ ATP database deleted"
    else
        echo "  [DRY-RUN] Would delete ATP database: $ATP_ID"
    fi
fi

# ============================================================================
# 2. Flexible Load Balancer — find and remove
# ============================================================================
echo ""
echo "=== Load Balancer ==="
if [ "$LB_ID" = "skip" ]; then
    echo "  LB_ID=skip — skipping LB cleanup"
else
    # Verify LB exists
    LB_CHECK=$(oci lb load-balancer get \
        --load-balancer-id "$LB_ID" \
        --query 'data."lifecycle-state"' \
        --raw-output 2>/dev/null || true)

    if [ -z "$LB_CHECK" ] || [ "$LB_CHECK" = "null" ]; then
        echo "  No LB found with ID: $LB_ID — already removed."
    else
        echo "  Found: $LB_ID (state: $LB_CHECK)"
        if $EXECUTE; then
            echo "  Deleting Load Balancer..."
            oci lb load-balancer delete \
                --load-balancer-id "$LB_ID" \
                --force 2>&1
            echo "  ✓ Load Balancer deleted"
        else
            echo "  [DRY-RUN] Would delete Load Balancer: $LB_ID"
        fi
    fi
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=== Post-Cleanup Architecture ==="
echo "  Compute:     Ampere A1.Flex (1 OCPU, 6 GB)"
echo "  Storage:     Boot volume ~47 GB (within 200 GB free)"
echo "  Network:     VCN (free) — public subnet only"
echo "  DNS:         Cloudflare → VM public IP"
echo "  Web Server:  Nginx serving static files from /var/www/oc-platform"
echo ""
echo "  Monthly cost: $0 (100% Always Free)"
echo ""

if ! $EXECUTE; then
    echo "👉 Re-run with --execute to apply changes."
fi
