# travelthread-web

Static website for [travelthread.app](https://travelthread.app) — landing page, legal docs, and invite deep link fallback.

## Pages
| File | URL | Purpose |
|------|-----|---------|
| `index.html` | `/` | Landing page |
| `privacy.html` | `/privacy.html` | Privacy Policy |
| `terms.html` | `/terms.html` | Terms of Service |
| `join/index.html` | `/join/{code}` | Invite deep link fallback |
| `_redirects` | — | Cloudflare Pages SPA routing for `/join/*` |

## Local preview
```bash
npx serve .
# open http://localhost:3000
```

## Deploy
Hosted on Cloudflare Pages (`travelthread-web` project), custom domain `travelthread.app`.

Wrangler fails on this machine due to a corporate proxy SSL issue. Deploy via the Python script instead:

```python
# deploy_cf.py — uses Cloudflare REST API directly
# Token: stored in project memory / ask Claude
python3 deploy_cf.py
```

Or push to GitHub (`Kaboomadin/travelthread-web`) and trigger a manual deploy from the Cloudflare dashboard.

## No build step
Plain HTML/CSS/JS — edit and deploy directly.
