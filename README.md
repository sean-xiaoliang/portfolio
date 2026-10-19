# liangxiao.de

Personal site of Xiao (Sean) Liang, served from Cloudflare Pages.

- `site/` is the static site: plain HTML and CSS, no build step, no JavaScript.
- `infra/` is Terraform for the Cloudflare Pages project, the custom domains and the DNS records.
- `.github/workflows/` holds two pipelines:
  - **Site:** validates the HTML on every pull request, then deploys `site/` to Cloudflare Pages with Wrangler on every push to `main`.
  - **Terraform:** runs `fmt` and `validate` on changes to `infra/`.

```
GitHub push ──► Actions: validate HTML ──► wrangler pages deploy ──► Cloudflare Pages
                                                                        ▲
Terraform (run locally) ── Pages project, domains, DNS records ─────────┘
```

## First-time setup

### 1. Put the code on GitHub

Create an empty public repository named `liangxiao-site`, then:

```bash
git remote add origin git@github.com:<your-username>/liangxiao-site.git
git push -u origin main
```

Replace every `GITHUB_USERNAME` in `site/index.html` with your username. The pipeline refuses to deploy while the placeholder is there.

### 2. Collect two IDs from Cloudflare

- **Account ID:** Cloudflare dashboard, open the account, copy *Account ID* from the right-hand panel of any domain's Overview page.
- **Zone ID:** the same panel on the `liangxiao.de` Overview page.

### 3. Create two API tokens

Dashboard: *My Profile → API Tokens → Create Token → Custom token*.

| Token | Permissions | Used by |
| --- | --- | --- |
| `terraform` | Account · Cloudflare Pages · Edit; Zone · DNS · Edit (zone: liangxiao.de) | You, when running Terraform |
| `deploy` | Account · Cloudflare Pages · Edit | GitHub Actions |

Two tokens keep the CI token from being able to change DNS.

### 4. Check existing DNS records

In *DNS → Records* for liangxiao.de, look for existing records named `liangxiao.de` (apex) or `www`. Terraform will fail if they already exist. Either delete them, or import them into Terraform. Records on other names (tunnel subdomains, the `_` ACM validation record from MSE805) are not touched.

### 5. Apply the Terraform

Install Terraform 1.6 or later, then:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in account_id and zone_id
export CLOUDFLARE_API_TOKEN=<terraform token>
terraform init
terraform plan
terraform apply
```

This creates the Pages project `liangxiao-site`, attaches `liangxiao.de` and `www.liangxiao.de`, and creates the two DNS records. Certificates are issued by Cloudflare within a few minutes.

State is kept locally in `infra/terraform.tfstate` (git-ignored). Back it up. A later improvement is moving state to an R2 bucket so it is shared and versioned.

### 6. Add GitHub secrets

Repository *Settings → Secrets and variables → Actions → New repository secret*:

- `CLOUDFLARE_API_TOKEN`: the `deploy` token
- `CLOUDFLARE_ACCOUNT_ID`: your account ID

### 7. Deploy

Push to `main`, or run the **Site** workflow by hand from the *Actions* tab. The site is live at https://liangxiao.de once the run finishes.

## Day-to-day changes

- **Edit text:** change `site/index.html`, open a pull request, check the run passes, merge.
- **Update the CV:** replace `site/cv/Xiao_Liang_CV.pdf`, keeping the same file name.
- **Preview locally:** `python3 -m http.server -d site 8000`, then open http://localhost:8000.
- **Validate HTML locally:** `npx html-validate "site/**/*.html"`.

## Security headers

`site/_headers` sets a strict Content Security Policy (no scripts at all), HSTS, `X-Frame-Options: DENY`, a referrer policy and a permissions policy. If you add JavaScript or another font provider, update the CSP there or the browser will block it.
