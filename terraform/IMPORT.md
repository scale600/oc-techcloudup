# Terraform Import Guide

This project has existing OCI resources. To bring them under Terraform management,
run the following import commands **once** before `terraform apply`.

## Prerequisites

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in real values
terraform init
```

## Import Commands

Run these in order. Each maps an existing OCI resource to a Terraform resource address.

### Network

```bash
# VCN
terraform import oci_core_vcn.oc_platform \
  ocid1.vcn.oc1.phx.amaaaaaanpazchiafmfpsczezn7jk4w6w6p65aiqxibqguda3uj7fnxhr3da

# Internet Gateway
terraform import oci_core_internet_gateway.igw \
  ocid1.internetgateway.oc1.phx.aaaaaaaazjrblhckqfe3ivdqhylqqkmdmfx4o6szxdcjv7smvjhwhab5re7a

# NAT Gateway
terraform import oci_core_nat_gateway.natgw \
  ocid1.natgateway.oc1.phx.aaaaaaaawdqnjegx4h75ew4ifxslzzmfs4qlrr5vwh5gklbjxwesywu36khq

# Route Tables
terraform import oci_core_route_table.pub_rt \
  ocid1.routetable.oc1.phx.aaaaaaaa7nup2gk367xzaluahxyi63iiq4z2j6b5orgl5a5itrzec5fsqyvq

terraform import oci_core_route_table.priv_rt \
  ocid1.routetable.oc1.phx.aaaaaaaatfftphz46h6mqmrkmvpo466jmtrbwtjo2efeg6fkiuz5nqu63inq

# Security Lists
terraform import oci_core_security_list.pub_sl \
  ocid1.securitylist.oc1.phx.aaaaaaaapzpws2v7j26r7xp6rdgfsp7gvqnwuheqwlc3gjdtd4cyniixpxrq

terraform import oci_core_security_list.priv_sl \
  ocid1.securitylist.oc1.phx.aaaaaaaae2w6n2vtf7ejylpgopf5qmp3d4egkwf5igpq5l45nszx22hmlp4q

# Subnets
terraform import oci_core_subnet.pub_ad1 \
  ocid1.subnet.oc1.phx.aaaaaaaapez6lu6niui2fweztioishqnir3zy5li37fhekgfisghkgvcznkq

terraform import oci_core_subnet.pub_ad2 \
  ocid1.subnet.oc1.phx.aaaaaaaafq4l7vro7jltnhe3t3f2gygjcjysfaghx5ohjblxat6r3bbncl3q

terraform import oci_core_subnet.priv_ad1 \
  ocid1.subnet.oc1.phx.aaaaaaaayyybpzqsacmidj3pwctce7i3b36wq7oj24kdoqqjye53kbtpbiaa
```

### Compute

```bash
# Instances
terraform import oci_core_instance.oc_a1 \
  ocid1.instance.oc1.phx.anyhqljsnpazchicehvesilhlooysj4dfzjd2tu4eucl6enw7kysx2idx6sq

terraform import oci_core_instance.oc_monitor \
  ocid1.instance.oc1.phx.anyhqljtnpazchicpf2vcd4ik4wi3zob4elxlttjgbuf4rio4rj6qb3mffca
```

## Verification

After importing all resources:

```bash
terraform plan   # Should show "No changes" — Terraform state matches reality
terraform apply  # Safe to apply — no drift expected
```

## Notes

- The Load Balancer (ocid1.loadbalancer...) has been deleted and is NOT in the Terraform config.
- `oc-platform-vm3` is TERMINATED and NOT in the Terraform config.
- Boot volumes are NOT directly imported — they are managed by the instance resource.
- After importing, run `terraform plan` to verify no unexpected drift before any changes.
