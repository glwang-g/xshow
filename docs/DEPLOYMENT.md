# Deployment

[中文版本](DEPLOYMENT.zh-CN.md)

The project ships with a GitHub Actions workflow that builds the Vite app whenever `main` is pushed and, when deployment secrets are configured, uploads `dist/` to a cloud server over SSH.

## GitHub Secrets

Add these repository secrets in **Settings -> Secrets and variables -> Actions**:

| Secret | Required | Example | Notes |
| --- | --- | --- | --- |
| `DEPLOY_HOST` | Yes | `203.0.113.10` | Server IP or domain. |
| `DEPLOY_USER` | Yes | `deploy` | SSH user on the server. |
| `DEPLOY_SSH_KEY` | Yes | private key text | Private key that can log in as `DEPLOY_USER`. |
| `DEPLOY_PATH` | Yes | `/var/www/xshow` | Directory where `dist/` should be published. |
| `DEPLOY_PORT` | No | `22` | SSH port. Defaults to `22`. |

If the required secrets are missing, the workflow still builds the app and skips the upload step with a warning.

Use a dedicated `DEPLOY_PATH`; deployment mirrors `dist/` with `rsync --delete`.

## Server Setup

Create a deployment user and target directory on the cloud server:

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /var/www/xshow
sudo chown -R deploy:deploy /var/www/xshow
```

Install the matching public key in `/home/deploy/.ssh/authorized_keys`.

Then serve the static files with Nginx, Caddy, or another web server. Example Nginx site:

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/xshow;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Reload Nginx after enabling the site:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Flow

1. Push to `main`.
2. GitHub Actions runs `pnpm install --frozen-lockfile` and `pnpm build`.
3. The workflow mirrors `dist/` to `DEPLOY_PATH` with `rsync --delete`.
4. The cloud server immediately serves the new static files.
