variable "account_id" {
  description = "Cloudflare account ID (dashboard: Account home > the account > Account ID)."
  type        = string
}

variable "zone_id" {
  description = "Zone ID of liangxiao.de (dashboard: the domain's Overview page, right-hand panel)."
  type        = string
}

variable "domain" {
  description = "Apex domain the site is served on."
  type        = string
  default     = "liangxiao.de"
}

variable "project_name" {
  description = "Cloudflare Pages project name. Lowercase letters, digits and hyphens only."
  type        = string
  default     = "liangxiao-site"
}

variable "production_branch" {
  description = "Git branch whose deployments go to production."
  type        = string
  default     = "main"
}
