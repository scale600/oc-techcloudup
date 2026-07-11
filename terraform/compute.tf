# ============================================================================
# Compute Instances
# ============================================================================
# oc-a1      — A1.Flex (1 OCPU, 6 GB), Oracle Linux 9, AD-2, production Nginx
# oc-monitor — E2.1.Micro (1 OCPU, 1 GB), Ubuntu 24.04, AD-1, Uptime Kuma
# ============================================================================

# --- oc-a1: Production Nginx Static Site ---

resource "oci_core_instance" "oc_a1" {
  compartment_id      = var.tenancy_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[1].name
  fault_domain        = "FAULT-DOMAIN-2"
  display_name        = "oc-a1"
  shape               = var.a1_shape

  shape_config {
    ocpus         = var.a1_ocpus
    memory_in_gbs = var.a1_memory_gb
  }

  source_details {
    source_id               = data.oci_core_images.ol9_arm.images[0].id
    source_type             = "image"
    boot_volume_size_in_gbs = var.a1_boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.pub_ad2.id
    display_name     = "oc-a1"
    assign_public_ip = true
    hostname_label   = "oc-a1"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    # user_data is for new instances only; ignored on existing ones
    user_data = base64encode(file("${path.module}/cloud-init/a1-bootstrap.yaml"))
  }

  freeform_tags = {
    Project     = var.project
    Environment = var.environment
    Role        = "web"
  }

  # Metadata (SSH keys, user_data) is managed by Ansible for existing instances.
  # user_data below is for NEW instances only and will be applied on creation.
  lifecycle {
    ignore_changes = [metadata]
  }
}

# --- oc-monitor: Uptime Kuma + Nginx Reverse Proxy ---

resource "oci_core_instance" "oc_monitor" {
  compartment_id      = var.tenancy_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  fault_domain        = "FAULT-DOMAIN-1"
  display_name        = "oc-monitor"
  shape               = var.monitor_shape

  source_details {
    source_id               = data.oci_core_images.ubuntu_24.images[0].id
    source_type             = "image"
    boot_volume_size_in_gbs = var.monitor_boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.pub_ad1.id
    display_name     = "oc-monitor"
    assign_public_ip = true
    hostname_label   = "oc-monitor"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    # user_data is for new instances only; applied on creation
    user_data = base64encode(file("${path.module}/cloud-init/monitor-bootstrap.yaml"))
  }

  freeform_tags = {
    Project     = var.project
    Environment = var.environment
    Role        = "monitoring"
  }

  # Metadata (SSH keys, user_data) is managed by Ansible for existing instances.
  lifecycle {
    ignore_changes = [metadata]
  }
}
