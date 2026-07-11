# ============================================================================
# Variables
# ============================================================================

# --- OCI Authentication ---
variable "tenancy_ocid" {
  description = "OCI tenancy OCID"
  type        = string
  sensitive   = true
}

variable "user_ocid" {
  description = "OCI user OCID"
  type        = string
  sensitive   = true
}

variable "fingerprint" {
  description = "API key fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API private key (.pem)"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-phoenix-1"
}

# --- SSH ---
variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

# --- Compute ---
variable "a1_shape" {
  description = "Shape for A1.Flex instance"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "a1_ocpus" {
  description = "OCPUs for A1.Flex (Always Free max: 4)"
  type        = number
  default     = 1
}

variable "a1_memory_gb" {
  description = "Memory in GB for A1.Flex (Always Free max: 24)"
  type        = number
  default     = 6
}

variable "a1_boot_volume_gb" {
  description = "Boot volume size for A1 instance"
  type        = number
  default     = 50
}

variable "monitor_shape" {
  description = "Shape for monitoring instance"
  type        = string
  default     = "VM.Standard.E2.1.Micro"
}

variable "monitor_boot_volume_gb" {
  description = "Boot volume size for monitor instance"
  type        = number
  default     = 50
}

# --- Network ---
variable "vcn_cidr" {
  description = "VCN CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "pub_subnet_ad1_cidr" {
  description = "Public subnet AD-1 CIDR"
  type        = string
  default     = "10.0.1.0/24"
}

variable "pub_subnet_ad2_cidr" {
  description = "Public subnet AD-2 CIDR"
  type        = string
  default     = "10.0.3.0/24"
}

variable "priv_subnet_ad1_cidr" {
  description = "Private subnet AD-1 CIDR"
  type        = string
  default     = "10.0.2.0/24"
}

# --- Tags ---
variable "project" {
  description = "Project name for resource tagging"
  type        = string
  default     = "oc-techcloudup"
}

variable "environment" {
  description = "Environment (production/staging)"
  type        = string
  default     = "production"
}
