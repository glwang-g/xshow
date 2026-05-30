# 自动部署

项目已经带了一个 GitHub Actions 工作流：每次推送到 `main` 时自动构建 Vite 应用；如果已经配置部署密钥，就会通过 SSH 把 `dist/` 上传到云服务器。

## GitHub Secrets

在仓库的 **Settings -> Secrets and variables -> Actions** 中添加这些 secrets：

| Secret | 是否必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| `DEPLOY_HOST` | 是 | `203.0.113.10` | 云服务器 IP 或域名。 |
| `DEPLOY_USER` | 是 | `deploy` | 服务器上的 SSH 用户。 |
| `DEPLOY_SSH_KEY` | 是 | 私钥文本 | 可以登录 `DEPLOY_USER` 的私钥。 |
| `DEPLOY_PATH` | 是 | `/var/www/xshow` | `dist/` 要发布到的服务器目录。 |
| `DEPLOY_PORT` | 否 | `22` | SSH 端口，默认是 `22`。 |

如果必填 secrets 还没配置，工作流会正常构建项目，但会跳过上传步骤并给出 warning，不会让整次 workflow 失败。

建议让 `DEPLOY_PATH` 使用独立目录；部署会用 `rsync --delete` 镜像 `dist/`。

## 云端记录的 GitHub Variables

如果线上演示站要启用 Supabase 云端记录，请在仓库的 **Settings -> Secrets and variables -> Actions** 中添加这些 repository variables 或 secrets：

| 名称 | 是否必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | 否 | `https://project-ref.supabase.co` | Supabase Data API URL。 |
| `VITE_SUPABASE_ANON_KEY` | 否 | `eyJ...` | Supabase 的 `anon public` key。不要使用 `service_role` key。 |

这些值会在构建时注入，因为 Vite 会把 `VITE_` 环境变量打进静态产物。如果没有配置，线上应用仍可正常本地使用，只会显示云端同步未配置。

## 服务器准备

在云服务器上创建部署用户和目标目录：

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /var/www/xshow
sudo chown -R deploy:deploy /var/www/xshow
```

把对应的公钥放到 `/home/deploy/.ssh/authorized_keys`。

然后用 Nginx、Caddy 或其他 Web Server 托管静态文件。下面是一个 Nginx 示例：

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

启用站点后重新加载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 流程

1. 推送代码到 `main`。
2. GitHub Actions 执行 `pnpm install --frozen-lockfile` 和 `pnpm build`。
3. 工作流用 `rsync --delete` 把 `dist/` 镜像到 `DEPLOY_PATH`。
4. 云服务器立即托管新的静态文件，用户可以访问最新版本。
