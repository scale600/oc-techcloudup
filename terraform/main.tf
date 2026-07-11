# ============================================================================
# OC TechCloudUp — Terraform Configuration
# ============================================================================
# OCI Always Free Tier infrastructure for oc.techcloudup.com
#
# Resources managed:
#   - VCN + subnets (public AD-1, public AD-2, private AD-1)
#   - Internet + NAT gateways
#   - Route tables (public → IGW, private → NAT)
#   - Security lists (public + private)
#   - Compute instances (oc-a1 A1.Flex, oc-monitor E2.1.Micro)
#
# Usage:
#   1. cp terraform.tfvars.example terraform.tfvars   # fill in real values
#   2. terraform init
#   3. terraform plan    (review changes)
#   4. terraform import  (bring existing resources under management — see below)
#   5. terraform apply
#
# Import existing resources (run once per resource):
#   terraform import oci_core_vcn.oc_platform        <vcn-ocid>
#   terraform import oci_core_internet_gateway.igw   <igw-ocid>
#   terraform import oci_core_nat_gateway.natgw      <natgw-ocid>
#   ... (see IMPORT.md for full list)
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }

  # Remote state (uncomment when ready):
  # backend "s3" {
  #   bucket = "oc-techcloudup-tfstate"
  #   key    = "terraform.tfstate"
  #   region = "us-phoenix-1"
  # }
}

# --- Provider ---
provider "oci" {
  region           = var.region
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
}

# --- Data Sources ---

# Availability domains in the region
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Latest Oracle Linux 9 aarch64 image (for A1.Flex)
data "oci_core_images" "ol9_arm" {
  compartment_id           = var.tenancy_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = ["Oracle-Linux-9.[0-9]*-aarch64-*"]
    regex  = true
  }
}

# Latest Ubuntu 24.04 image (for E2.1.Micro)
data "oci_core_images" "ubuntu_24" {
  compartment_id           = var.tenancy_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = "VM.Standard.E2.1.Micro"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}
