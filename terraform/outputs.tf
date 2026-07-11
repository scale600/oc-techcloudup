# ============================================================================
# Outputs
# ============================================================================

output "availability_domains" {
  description = "Availability domains in the region"
  value       = data.oci_identity_availability_domains.ads.availability_domains[*].name
}

# --- VCN ---
output "vcn_id" {
  description = "VCN OCID"
  value       = oci_core_vcn.oc_platform.id
}

# --- Subnets ---
output "pub_subnet_ad1_id" {
  description = "Public subnet AD-1 OCID"
  value       = oci_core_subnet.pub_ad1.id
}

output "pub_subnet_ad2_id" {
  description = "Public subnet AD-2 OCID"
  value       = oci_core_subnet.pub_ad2.id
}

output "priv_subnet_ad1_id" {
  description = "Private subnet AD-1 OCID"
  value       = oci_core_subnet.priv_ad1.id
}

# --- Instances ---
output "oc_a1" {
  description = "oc-a1 instance details"
  value = {
    id        = oci_core_instance.oc_a1.id
    public_ip = oci_core_instance.oc_a1.public_ip
    shape     = oci_core_instance.oc_a1.shape
  }
}

output "oc_monitor" {
  description = "oc-monitor instance details"
  value = {
    id        = oci_core_instance.oc_monitor.id
    public_ip = oci_core_instance.oc_monitor.public_ip
    shape     = oci_core_instance.oc_monitor.shape
  }
}

# --- URLs ---
output "site_url" {
  description = "Production site URL"
  value       = "https://oc.techcloudup.com"
}

output "monitor_url" {
  description = "Uptime Kuma dashboard URL"
  value       = "http://${oci_core_instance.oc_monitor.public_ip}:3001"
}

# --- Images used ---
output "ol9_arm_image" {
  description = "Oracle Linux 9 ARM image used for A1"
  value       = data.oci_core_images.ol9_arm.images[0].display_name
}

output "ubuntu_24_image" {
  description = "Ubuntu 24.04 image used for monitor"
  value       = data.oci_core_images.ubuntu_24.images[0].display_name
}
