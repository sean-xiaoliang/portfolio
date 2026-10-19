terraform {
  required_version = ">= 1.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# The API token is read from the CLOUDFLARE_API_TOKEN environment variable,
# so it never appears in code or state files.
provider "cloudflare" {}
