#!/bin/bash
# ============================================================================
# a1-capacity-check.sh — Polls OCI for Ampere A1.Flex capacity and provisions
# ============================================================================
# Runs from the existing E2.1 VM via cron (every 30 min).
# Loops through all 3 ADs in us-phoenix-1, attempts to launch an A1.Flex
# instance (2 OCPU / 12 GB). On success, writes instance metadata to
# /tmp/a1-provisioned.env and exits 0 so a follow-up migration can run.
#
# Usage:
#   source scripts/oci-vars.sh
#   ./scripts/a1-capacity-check.sh
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/a1-check.log"

# --- Source vars ---
if [ -f "$SCRIPT_DIR/oci-vars.sh" ]; then
    source "$SCRIPT_DIR/oci-vars.sh"
else
    echo "[$(date)] FATAL: oci-vars.sh not found" | tee -a "$LOG_FILE"
    exit 1
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# --- Ensure we don't already have an A1 running ---
EXISTING=$(oci compute instance list \
    --compartment-id "$COMPARTMENT_ID" \
    --display-name "oc-public-a1" \
    --lifecycle-state RUNNING \
    --query 'data[0].id' \
    --raw-output 2>/dev/null || true)

if [ -n "$EXISTING" ] && [ "$EXISTING" != "null" ]; then
    log "A1 instance already running: $EXISTING — nothing to do"
    exit 0
fi

# --- Look up the latest Oracle Linux 9 image for A1 shape ---
log "Looking up OL9 image for A1.Flex..."
IMAGE_ID=$(oci compute images list \
    --compartment-id "$COMPARTMENT_ID" \
    --operating-system "Oracle Linux" \
    --operating-system-version "9" \
    --shape "VM.Standard.A1.Flex" \
    --sort-by TIMECREATED \
    --limit 1 \
    --query 'data[0].id' \
    --raw-output 2>/dev/null)

if [ -z "$IMAGE_ID" ] || [ "$IMAGE_ID" = "null" ]; then
    log "FATAL: Could not find OL9 image for A1.Flex"
    exit 1
fi
log "Image: $IMAGE_ID"

# --- SSH key ---
SSH_KEY_FILE="${HOME}/.ssh/oc-techcloudup.pub"
if [ ! -f "$SSH_KEY_FILE" ]; then
    log "FATAL: SSH key not found at $SSH_KEY_FILE"
    exit 1
fi

# --- Cloud-init bootstrap ---
USER_DATA_FILE="$SCRIPT_DIR/cloud-init/a1-bootstrap.sh"

# --- Ensure AD-3 subnet exists (create on demand) ---
ensure_ad3_subnet() {
    EXISTING_SUB3=$(oci network subnet list \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --display-name "pub-subnet-ad3" \
        --query 'data[0].id' \
        --raw-output 2>/dev/null || true)

    if [ -n "$EXISTING_SUB3" ] && [ "$EXISTING_SUB3" != "null" ]; then
        echo "$EXISTING_SUB3"
        return
    fi

    log "Creating pub-subnet-ad3 (10.0.4.0/24, PHX-AD-3)..."
    SUBNET3=$(oci network subnet create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --cidr-block "10.0.4.0/24" \
        --display-name "pub-subnet-ad3" \
        --availability-domain "PHX-AD-3" \
        --route-table-id "$PUB_RT" \
        --security-list-ids "[\"$PUB_SL\"]" \
        --query 'data.id' \
        --raw-output 2>/dev/null)

    if [ -n "$SUBNET3" ]; then
        log "Created pub-subnet-ad3: $SUBNET3"
        echo "$SUBNET3"
    else
        log "WARN: Could not create AD-3 subnet"
        echo ""
    fi
}

# --- AD → Subnet mapping ---
declare -A AD_SUBNET
AD_SUBNET["PHX-AD-1"]="$PUB_SUBNET"
AD_SUBNET["PHX-AD-2"]="$PUB_SUBNET2"
AD_SUBNET["PHX-AD-3"]="$(ensure_ad3_subnet)"

# --- Try each AD ---
for AD in "PHX-AD-1" "PHX-AD-2" "PHX-AD-3"; do
    SUBNET_ID="${AD_SUBNET[$AD]}"

    if [ -z "$SUBNET_ID" ] || [ "$SUBNET_ID" = "null" ]; then
        log "SKIP $AD: no subnet available"
        continue
    fi

    log "=== Attempting launch in $AD (subnet $SUBNET_ID) ==="

    # Launch instance — capture both stdout (JSON) and stderr (errors)
    LAUNCH_OUTPUT=$(mktemp)
    LAUNCH_EXIT=0
    oci compute instance launch \
        --compartment-id "$COMPARTMENT_ID" \
        --availability-domain "$AD" \
        --subnet-id "$SUBNET_ID" \
        --shape "VM.Standard.A1.Flex" \
        --shape-config '{"ocpus":2,"memoryInGBs":12}' \
        --image-id "$IMAGE_ID" \
        --ssh-authorized-keys-file "$SSH_KEY_FILE" \
        --user-data-file "$USER_DATA_FILE" \
        --display-name "oc-public-a1" \
        --boot-volume-size-in-gbs 50 \
        --assign-public-ip true \
        >"$LAUNCH_OUTPUT" 2>&1 || LAUNCH_EXIT=$?

    LAUNCH_BODY=$(cat "$LAUNCH_OUTPUT")
    rm -f "$LAUNCH_OUTPUT"

    if [ "$LAUNCH_EXIT" -eq 0 ]; then
        # Success — extract instance ID and public IP
        INSTANCE_ID=$(echo "$LAUNCH_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])" 2>/dev/null || true)
        INSTANCE_IP=$(echo "$LAUNCH_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['public-ip'])" 2>/dev/null || true)

        if [ -z "$INSTANCE_ID" ] || [ -z "$INSTANCE_IP" ]; then
            log "ERROR: Launch succeeded but could not parse instance ID/IP"
            log "Raw: $(echo "$LAUNCH_BODY" | head -20)"
            continue
        fi

        log "SUCCESS! A1 instance provisioned in $AD"
        log "  Instance ID : $INSTANCE_ID"
        log "  Public IP   : $INSTANCE_IP"

        # Write env file for migration script
        cat > /tmp/a1-provisioned.env <<ENVEOF
A1_INSTANCE_ID=$INSTANCE_ID
A1_INSTANCE_IP=$INSTANCE_IP
A1_AD=$AD
PROVISIONED_AT=$(date -Iseconds)
ENVEOF

        log "Wrote /tmp/a1-provisioned.env. Ready for migration."
        exit 0
    fi

    # --- Classify failure ---
    if echo "$LAUNCH_BODY" | grep -qi "Out of host capacity"; then
        log "FAIL $AD: Out of host capacity"
    elif echo "$LAUNCH_BODY" | grep -qi "LimitExceeded\|QuotaExceeded\|ServiceLimit"; then
        log "FAIL $AD: Service limit exceeded — check tenancy limits"
        # Don't retry other ADs if we're at tenancy limit
        exit 1
    else
        log "FAIL $AD: Unexpected error"
        log "  $(echo "$LAUNCH_BODY" | tail -5)"
    fi
done

log "All ADs exhausted. No A1 capacity available in us-phoenix-1."
log "Will retry on next cron cycle."
exit 0
