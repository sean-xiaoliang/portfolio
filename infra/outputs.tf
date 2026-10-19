output "pages_dev_url" {
  description = "Default Cloudflare URL of the site, useful before DNS is live."
  value       = "https://${cloudflare_pages_project.site.name}.pages.dev"
}

output "site_urls" {
  description = "Custom domain URLs served by the Pages project."
  value       = [for h in local.hostnames : "https://${h}"]
}
