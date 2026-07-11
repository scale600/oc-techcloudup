# ============================================================================
# Network Resources
# ============================================================================
# VCN 10.0.0.0/16
#   ├── Public Subnet AD-1  (10.0.1.0/24) — oc-monitor
#   ├── Public Subnet AD-2  (10.0.3.0/24) — oc-a1
#   └── Private Subnet AD-1 (10.0.2.0/24) — future DB/services
# ============================================================================

# --- VCN ---
resource "oci_core_vcn" "oc_platform" {
  compartment_id = var.tenancy_ocid
  cidr_block     = var.vcn_cidr
  display_name   = "oc-platform-vcn"
  dns_label      = "ocplatform"

  freeform_tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# --- Internet Gateway ---
resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-igw"
  enabled        = true
}

# --- NAT Gateway ---
resource "oci_core_nat_gateway" "natgw" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-natgw"
}

# --- Subnets ---

# Public subnet in AD-1 (oc-monitor)
resource "oci_core_subnet" "pub_ad1" {
  compartment_id             = var.tenancy_ocid
  vcn_id                     = oci_core_vcn.oc_platform.id
  cidr_block                 = var.pub_subnet_ad1_cidr
  display_name               = "oc-public-subnet"
  dns_label                  = "public"
  availability_domain        = data.oci_identity_availability_domains.ads.availability_domains[0].name
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.pub_rt.id
  security_list_ids          = [oci_core_security_list.pub_sl.id]
}

# Public subnet in AD-2 (oc-a1)
resource "oci_core_subnet" "pub_ad2" {
  compartment_id             = var.tenancy_ocid
  vcn_id                     = oci_core_vcn.oc_platform.id
  cidr_block                 = var.pub_subnet_ad2_cidr
  display_name               = "oc-public-subnet-2"
  dns_label                  = "pub2"
  availability_domain        = data.oci_identity_availability_domains.ads.availability_domains[1].name
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.pub_rt.id
  security_list_ids          = [oci_core_security_list.pub_sl.id]
}

# Private subnet in AD-1
resource "oci_core_subnet" "priv_ad1" {
  compartment_id             = var.tenancy_ocid
  vcn_id                     = oci_core_vcn.oc_platform.id
  cidr_block                 = var.priv_subnet_ad1_cidr
  display_name               = "oc-private-subnet"
  dns_label                  = "private"
  availability_domain        = data.oci_identity_availability_domains.ads.availability_domains[0].name
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.priv_rt.id
  security_list_ids          = [oci_core_security_list.priv_sl.id]
}

# --- Route Tables ---

resource "oci_core_route_table" "pub_rt" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

resource "oci_core_route_table" "priv_rt" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-private-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.natgw.id
  }
}

# --- Security Lists ---

resource "oci_core_security_list" "pub_sl" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-public-sl"

  # --- Ingress ---

  # SSH management
  ingress_security_rules {
    description = "SSH management"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 22
      min = 22
    }
  }

  # HTTP inbound
  ingress_security_rules {
    description = "HTTP inbound"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 80
      min = 80
    }
  }

  # HTTPS inbound
  ingress_security_rules {
    description = "HTTPS inbound"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 443
      min = 443
    }
  }

  # Uptime Kuma dashboard
  ingress_security_rules {
    description = "Uptime Kuma monitoring dashboard"
    protocol    = "6"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 3001
      min = 3001
    }
  }

  # All VCN internal traffic
  ingress_security_rules {
    description = "All VCN internal"
    protocol    = "all"
    source      = "10.0.0.0/16"
    source_type = "CIDR_BLOCK"
  }

  # --- Egress ---

  # HTTP out (updates)
  egress_security_rules {
    description = "HTTP out for updates"
    protocol    = "6"
    destination = "0.0.0.0/0"

    tcp_options {
      max = 80
      min = 80
    }
  }

  # HTTPS out
  egress_security_rules {
    description = "HTTPS out"
    protocol    = "6"
    destination = "0.0.0.0/0"

    tcp_options {
      max = 443
      min = 443
    }
  }
}

resource "oci_core_security_list" "priv_sl" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.oc_platform.id
  display_name   = "oc-private-sl"

  # --- Ingress ---

  # HTTPS from public subnet
  ingress_security_rules {
    description = "HTTPS from public subnet"
    protocol    = "6"
    source      = "10.0.1.0/24"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 443
      min = 443
    }
  }

  # DB access from public subnet
  ingress_security_rules {
    description = "DB access from public subnet"
    protocol    = "6"
    source      = "10.0.1.0/24"
    source_type = "CIDR_BLOCK"

    tcp_options {
      max = 1522
      min = 1522
    }
  }

  # --- Egress ---

  # HTTPS out to internet
  egress_security_rules {
    description = "HTTPS out to internet"
    protocol    = "6"
    destination = "0.0.0.0/0"

    tcp_options {
      max = 443
      min = 443
    }
  }
}
