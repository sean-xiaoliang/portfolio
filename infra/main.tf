# Pages project set up for Direct Upload: GitHub Actions builds nothing and
# uploads the site/ folder with Wrangler, so no Git integration is needed here.
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = var.production_branch
}

locals {
  hostnames = {
    apex = var.domain
    www  = "www.${var.domain}"
  }
}

# Attach both hostnames to the Pages project (Cloudflare issues the TLS certificates).
resource "cloudflare_pages_domain" "site" {
  for_each = local.hostnames

  account_id   = var.account_id
  project_name = cloudflare_pages_project.site.name
  name         = each.value
}

# Point both hostnames at the project. A CNAME on the apex works because
# Cloudflare flattens it to A/AAAA records.
resource "cloudflare_dns_record" "site" {
  for_each = local.hostnames

  zone_id = var.zone_id
  name    = each.value
  type    = "CNAME"
  content = "${cloudflare_pages_project.site.name}.pages.dev"
  proxied = true
  ttl     = 1
  comment = "Managed by Terraform: liangxiao-site"
}
