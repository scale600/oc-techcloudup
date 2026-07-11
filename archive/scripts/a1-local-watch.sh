#!/bin/bash
set -euo pipefail

# Source from oci-vars.sh or set manually
COMP="${COMPARTMENT_ID:-}"
LOG="/tmp/a1-watch.log"
SN1="${SUBNET_ID_1:-}"
SN2="${SUBNET_ID_2:-}"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# Already provisioned?
EXISTING=$(oci compute instance list -c "$COMP" --display-name "oc-a1" --lifecycle-state RUNNING --query 'data[0].id' --raw-output 2>/dev/null || true)
if [ -n "$EXISTING" ] && [ "$EXISTING" != "null" ]; then
  IP=$(oci compute instance list-vnics --instance-id "$EXISTING" --query 'data[0]."public-ip"' --raw-output 2>/dev/null)
  log "A1 RUNNING: $IP ($EXISTING)"
  exit 0
fi

IMAGE=$(oci compute image list -c "$COMP" --operating-system "Oracle Linux" --operating-system-version 9 --shape "VM.Standard.A1.Flex" --sort-by TIMECREATED --limit 1 --query 'data[0].id' --raw-output 2>/dev/null)

for AD in "WVrK:PHX-AD-1" "WVrK:PHX-AD-2"; do
  if [ "$AD" = "WVrK:PHX-AD-1" ]; then SN="$SN1"; else SN="$SN2"; fi
  
  log "Trying $AD..."
  RESULT=$(oci compute instance launch \
    -c "$COMP" --availability-domain "$AD" --subnet-id "$SN" \
    --shape "VM.Standard.A1.Flex" --shape-config '{"ocpus":1,"memory-in-gbs":6}' \
    --image-id "$IMAGE" --display-name "oc-a1" --boot-volume-size-in-gbs 50 \
    --ssh-authorized-keys-file "$HOME/.ssh/id_rsa.pub" \
    --assign-public-ip true 2>&1) || true
  
  if echo "$RESULT" | grep -q "Out of host capacity"; then
    log "[$AD] No capacity"
  elif echo "$RESULT" | grep -q '"id":'; then
    IID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    IIP=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['public-ip'])" 2>/dev/null)
    log "SUCCESS! $AD: $IIP ($IID)"
    exit 0
  else
    log "[$AD] $(echo "$RESULT" | tail -3 | head -1)"
  fi
done

log "All ADs: no A1 capacity."
