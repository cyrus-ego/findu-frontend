# Deploy FindU Frontend len VPS bang Docker

Tai lieu nay mo ta quy trinh deploy **FindU Frontend - Next.js 15** len VPS `hai@oc2.lifebow.net` bang Docker Compose, bao gom tao file `.env`, build image, chay container, cau hinh reverse proxy va redeploy.

> Trang thai hien tai: frontend public chay tai `https://chatvn.online`, backend/API public chay tai `https://api.chatvn.online`. Tren VPS, Nginx proxy frontend ve `127.0.0.1:3002` va API ve `127.0.0.1:3001`.

---

## 1. Tong quan

Project da co san:

| File | Vai tro |
| --- | --- |
| `Dockerfile` | Build Next.js standalone image voi Node 20 Alpine |
| `docker-compose.yml` | Build/chay container frontend tren VPS |
| `docker-compose.prod.yml` | Chay image da build san tu GHCR tren VPS |
| `.github/workflows/deploy-vps.yml` | GitHub Actions build/push GHCR va deploy VPS |
| `.env.example` | Mau bien moi truong can tao thanh `.env` |
| `next.config.ts` | Bat `output: 'standalone'` va rewrite `/socket.io` ve backend |

Container frontend chay port noi bo `3001` va expose ra host port `3002` de khong trung voi backend dang chay tren host port `3001`. Nginx nhan request HTTPS tu `https://chatvn.online` va proxy ve `127.0.0.1:3002`. API public la `https://api.chatvn.online`, Nginx proxy ve backend tren `127.0.0.1:3001`.

---

## 2. Bien moi truong

Tao file `.env` tren VPS tu `.env.example`.

```env
APP_PORT=3002
PORT=3001
IMAGE_NAME=ghcr.io/cyrus-ego/findu-frontend
CONTAINER_NAME=findu-frontend

NEXT_PUBLIC_API_URL=https://api.chatvn.online/api
NEXT_PUBLIC_SOCKET_URL=https://api.chatvn.online
NEXT_PUBLIC_BACKEND_URL=https://api.chatvn.online
```

Y nghia cac bien:

| Bien | Y nghia |
| --- | --- |
| `APP_PORT` | Port expose tren VPS host; dang dung `3002` cho frontend |
| `PORT` | Port Next.js standalone lang nghe trong container |
| `NEXT_PUBLIC_API_URL` | URL REST API, phai co `/api` |
| `NEXT_PUBLIC_SOCKET_URL` | URL backend socket fallback |
| `NEXT_PUBLIC_BACKEND_URL` | URL backend dung cho rewrite `/socket.io` va upload/avatar |

Luu y quan trong: cac bien `NEXT_PUBLIC_*` cua Next.js duoc nhung vao client bundle luc build. Moi lan doi cac bien nay phai build lai image.

Backend hien tai dung domain rieng:

```env
NEXT_PUBLIC_API_URL=https://api.chatvn.online/api
NEXT_PUBLIC_SOCKET_URL=https://api.chatvn.online
NEXT_PUBLIC_BACKEND_URL=https://api.chatvn.online
```

---

## 3. Chuan bi SSH

Tu may local:

```bash
ssh hai@oc2.lifebow.net
```

Neu gap loi:

```text
Permission denied (publickey).
```

Trong phien nay key dung duoc la:

```bash
ssh -i ~/.ssh/id_rsa_vps hai@oc2.lifebow.net
```

Neu mot may khac gap loi public key, hay them public key cua may deploy vao VPS:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy output vao file tren VPS:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Sau do thu lai:

```bash
ssh hai@oc2.lifebow.net
```

---

## 4. Cai Docker tren VPS

Dang nhap VPS:

```bash
ssh hai@oc2.lifebow.net
```

Kiem tra Docker:

```bash
docker --version
docker compose version
```

Neu chua co Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker hai
newgrp docker
```

Kiem tra lai:

```bash
docker run --rm hello-world
docker compose version
```

---

## 5. Dua source code len VPS

Trong phien deploy nay app duoc dat tai `/home/hai/dev/findu-frontend` vi user `hai` khong co sudo non-interactive de tao thu muc trong `/opt`.

```bash
mkdir -p /home/hai/dev/findu-frontend
cd /home/hai/dev/findu-frontend
```

### Cach da dung trong phien nay: rsync tu may local

Chay tren may local, tai thu muc repo:

```bash
rsync -az \
  -e 'ssh -i ~/.ssh/id_rsa_vps -o IdentitiesOnly=yes' \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude '.DS_Store' \
  ./ hai@oc2.lifebow.net:/home/hai/dev/findu-frontend/
```

Neu can gui rieng `.env.example` sau khi exclude qua rong:

```bash
rsync -az \
  -e 'ssh -i ~/.ssh/id_rsa_vps -o IdentitiesOnly=yes' \
  .env.example hai@oc2.lifebow.net:/home/hai/dev/findu-frontend/.env.example
```

### Cach thay the: clone Git tren VPS

Chi dung cach nay neu code moi da duoc push len GitHub va VPS co quyen clone repo:

```bash
cd /home/hai/dev/findu-frontend
git clone git@github.com:cyrus-ego/findu-frontend.git .
```

---

## 6. Tao file `.env` tren VPS

```bash
cd /home/hai/dev/findu-frontend
cp .env.example .env
nano .env
```

Noi dung mau hien tai:

```env
APP_PORT=3002
PORT=3001
IMAGE_NAME=findu-frontend
CONTAINER_NAME=findu-frontend

NEXT_PUBLIC_API_URL=https://api.chatvn.online/api
NEXT_PUBLIC_SOCKET_URL=https://api.chatvn.online
NEXT_PUBLIC_BACKEND_URL=https://api.chatvn.online
```

Khong commit `.env` len Git. File nay da nam trong `.gitignore`.

---

## 7. Build va chay container

Tai thu muc app:

```bash
cd /home/hai/dev/findu-frontend
docker compose --env-file .env up -d --build
```

Kiem tra container:

```bash
docker compose ps
docker compose logs -f --tail=100 frontend
curl -I http://127.0.0.1:3002/
```

Neu chua dung Nginx, co the truy cap tam bang IP/host kem port:

```text
http://<VPS_PUBLIC_IP>:3002
```

Neu VPS co firewall, mo port 3002:

```bash
sudo ufw allow 3002/tcp
sudo ufw status
```

---

## 8. Cau hinh Nginx reverse proxy

Neu muon dung domain khong kem port, cai Nginx:

```bash
sudo apt update
sudo apt install -y nginx
```

Tao config:

```bash
sudo nano /etc/nginx/sites-available/findu-frontend
```

Noi dung:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name chatvn.online www.chatvn.online;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    listen [::]:80;

    server_name api.chatvn.online;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/findu-frontend /etc/nginx/sites-enabled/findu-frontend
sudo nginx -t
sudo systemctl reload nginx
```

Sau do truy cap:

```text
https://chatvn.online
```

---

## 9. Bat HTTPS voi Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d chatvn.online -d www.chatvn.online -d api.chatvn.online
```

Kiem tra auto-renew:

```bash
sudo certbot renew --dry-run
```

Sau khi co HTTPS, frontend public URL la:

```text
https://chatvn.online
```

---

## 10. Cau hinh backend sau khi doi domain

Neu frontend chuyen sang `https://chatvn.online`, backend can cho phep domain moi.

Can cap nhat:

| Hang muc | Gia tri can them |
| --- | --- |
| CORS origin | `https://chatvn.online` |
| OAuth callback | `https://chatvn.online/auth/callback` |
| Cookie domain/SameSite | Kiem tra neu backend dung cookie cross-site |
| Socket.IO CORS | `https://chatvn.online` |

Neu backend van nam o Railway, can set cac bien moi tren service backend roi redeploy backend.

---

## 11. Redeploy khi co code moi

Neu dang deploy theo cach rsync, chay tren may local:

```bash
cd /Users/hainguyen/dev/findu-frontend
rsync -az \
  -e 'ssh -i ~/.ssh/id_rsa_vps -o IdentitiesOnly=yes' \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude '.DS_Store' \
  ./ hai@oc2.lifebow.net:/home/hai/dev/findu-frontend/
```

Sau do build lai tren VPS:

```bash
cd /home/hai/dev/findu-frontend
docker compose --env-file .env up -d --build
docker compose logs -f --tail=100 frontend
```

Neu thu muc tren VPS la Git clone day du, co the thay buoc rsync bang `git pull`.

Don image cu neu can:

```bash
docker image prune -f
```

---

## 12. GitHub Actions + GHCR auto deploy

Da them workflow:

```text
.github/workflows/deploy-vps.yml
```

Workflow nay chay khi push len branch `release1.0.0` hoac bam **Run workflow** thu cong. Luong deploy:

1. Checkout code tren GitHub runner.
2. Build Docker image bang `Dockerfile`.
3. Push image len GHCR:

```text
ghcr.io/cyrus-ego/findu-frontend:latest
ghcr.io/cyrus-ego/findu-frontend:<git-sha>
```

4. SSH vao VPS.
5. Copy `docker-compose.prod.yml` len `/home/hai/dev/findu-frontend`.
6. Pull image moi tu GHCR va restart container `findu-frontend`.

### 12.1. GitHub Secrets can tao

Vao GitHub repo:

```text
Settings -> Secrets and variables -> Actions -> Secrets
```

Tao cac secret:

| Secret | Gia tri |
| --- | --- |
| `VPS_SSH_KEY` | Noi dung private key dung de SSH vao VPS, vi du file `~/.ssh/id_rsa_vps` |
| `VPS_HOST` | `oc2.lifebow.net` |
| `VPS_USER` | `hai` |
| `GHCR_READ_TOKEN` | PAT co quyen `read:packages`, chi can neu GHCR package de private |
| `GHCR_USERNAME` | `cyrus-ego`, chi can neu dung `GHCR_READ_TOKEN` |

Trong workflow hien tai, `VPS_HOST` va `VPS_USER` da co default la `oc2.lifebow.net` va `hai`, nhung nen tao secret de sau nay doi host/user khong can sua file YAML.

Lay private key de copy vao `VPS_SSH_KEY`:

```bash
cat ~/.ssh/id_rsa_vps
```

Khong commit private key vao Git.

### 12.2. GitHub Variables nen tao

Vao:

```text
Settings -> Secrets and variables -> Actions -> Variables
```

Tao cac variable:

| Variable | Gia tri hien tai |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.chatvn.online/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.chatvn.online` |
| `NEXT_PUBLIC_BACKEND_URL` | `https://api.chatvn.online` |

Workflow co default cho 3 bien nay, nhung tao Variables giup doi backend URL ma khong can sua workflow.

### 12.3. Quyen GHCR

Workflow dung `GITHUB_TOKEN` de push image len GHCR. File workflow da khai bao:

```yaml
permissions:
  contents: read
  packages: write
```

Neu GHCR package la private, VPS can login GHCR truoc khi pull image. Tao `GHCR_READ_TOKEN` la GitHub Personal Access Token co scope:

```text
read:packages
```

Neu muon don gian hon, co the doi package `findu-frontend` tren GHCR sang public, khi do khong can `GHCR_READ_TOKEN`.

### 12.4. Kiem tra deploy tu GitHub

Sau khi push code:

```bash
git push origin release1.0.0
```

Vao GitHub:

```text
Actions -> Deploy frontend to VPS
```

Khi workflow thanh cong, kiem tra:

```bash
curl -I https://chatvn.online/
```

Tren VPS:

```bash
ssh -i ~/.ssh/id_rsa_vps hai@oc2.lifebow.net
cd /home/hai/dev/findu-frontend
docker compose --env-file .env -f docker-compose.prod.yml ps
docker compose --env-file .env -f docker-compose.prod.yml logs --tail=100 frontend
```

### 12.5. Pull/up thu cong tren VPS

Co the dung script nay tren VPS de pull image GHCR moi va restart container bang `docker-compose.prod.yml`:

```bash
cd /home/hai/dev/findu-frontend
bash scripts/docker-pull-up.sh
```

Script mac dinh doc `.env`, dung `docker-compose.prod.yml`, pull service `frontend`, sau do `up -d frontend`.

Neu muon chay mot tag cu the:

```bash
bash scripts/docker-pull-up.sh --tag <git-sha>
```

Neu muon don image cu sau khi deploy:

```bash
bash scripts/docker-pull-up.sh --prune
```

---

## 13. Doi bien moi truong

Sua `.env`:

```bash
cd /home/hai/dev/findu-frontend
nano .env
```

Neu deploy bang GitHub Actions, sua GitHub Variables `NEXT_PUBLIC_*` roi chay lai workflow. Vi `NEXT_PUBLIC_*` can co luc build, chi restart container la chua du.

Neu build truc tiep tren VPS, build lai image:

```bash
docker compose --env-file .env up -d --build
```

---

## 14. Lenh quan tri nhanh

```bash
# Xem trang thai
docker compose ps

# Xem log
docker compose logs -f --tail=100 frontend

# Restart
docker compose restart frontend

# Stop
docker compose down

# Build lai khong dung cache
docker compose build --no-cache frontend
docker compose up -d
```

---

## 15. Troubleshooting

### SSH bi `Permission denied (publickey)`

Public key hien tai chua duoc them vao user `hai` tren VPS. Them key vao:

```text
/home/hai/.ssh/authorized_keys
```

### Container build fail o `npm ci`

Dockerfile dang dung:

```bash
npm ci --legacy-peer-deps
```

Neu fail, xem log:

```bash
docker compose build --no-cache frontend
```

### Website khong vao duoc port 3002

Kiem tra container co dang chay khong:

```bash
docker compose ps
curl -I http://127.0.0.1:3002/
```

Kiem tra firewall/security group:

```bash
sudo ufw status
sudo ufw allow 3002/tcp
```

Neu da dung Nginx thi khong can public port 3002 ra internet, chi can Nginx proxy duoc ve `127.0.0.1:3002`.

### Socket.IO khong connect

Kiem tra:

- `NEXT_PUBLIC_BACKEND_URL` tro dung backend public URL.
- Nginx co header `Upgrade` va `Connection "upgrade"`.
- Backend cho phep CORS/Socket.IO origin `https://chatvn.online`.
- Sau khi sua `.env`, da chay lai `docker compose up -d --build`.

### Doi `.env` nhung frontend van goi URL cu

Day la hanh vi binh thuong cua Next.js voi `NEXT_PUBLIC_*`. Can build lai image:

```bash
docker compose --env-file .env up -d --build
```

### GitHub Actions pull GHCR bi denied

Neu log deploy tren GitHub bao loi pull image tu `ghcr.io`, kiem tra:

- Package GHCR co public khong.
- Neu package private, da tao `GHCR_READ_TOKEN` co scope `read:packages` chua.
- `GHCR_USERNAME` dung owner co quyen doc package chua.

### GitHub Actions bao `no matching manifest for linux/arm64/v8`

VPS `oc2.lifebow.net` dang chay CPU ARM64 (`aarch64`). Workflow phai build image cho platform `linux/arm64`:

```yaml
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    platforms: linux/arm64
```

Sau khi sua workflow, push lai branch `release1.0.0` hoac bam **Re-run jobs** tren GitHub Actions de build lai image GHCR dung architecture.

### GitHub Actions SSH fail

Kiem tra:

- `VPS_SSH_KEY` la private key, khong phai `.pub`.
- Public key tuong ung da co trong `/home/hai/.ssh/authorized_keys`.
- Secret `VPS_HOST=oc2.lifebow.net`, `VPS_USER=hai`.
- Key khong co passphrase, hoac dung deploy key rieng khong passphrase cho CI.

---

## 16. Checklist deploy

1. SSH vao duoc `hai@oc2.lifebow.net`.
2. Docker va Docker Compose da cai tren VPS.
3. Source code nam tai `/home/hai/dev/findu-frontend`.
4. File `.env` da tao tu `.env.example` va dien dung backend URL.
5. Da chay `docker compose --env-file .env up -d --build`.
6. `curl -I http://127.0.0.1:3002/` tra ve HTTP 200/3xx.
7. `curl -I https://chatvn.online/` tra ve HTTP 200/3xx.
8. Nginx proxy domain `chatvn.online` ve `127.0.0.1:3002` va `api.chatvn.online` ve `127.0.0.1:3001`.
9. Neu bat HTTPS, backend can cap nhat CORS/OAuth callback cho domain moi.
10. GitHub Actions co `VPS_SSH_KEY` va Variables `NEXT_PUBLIC_*`.
11. GHCR image `ghcr.io/cyrus-ego/findu-frontend:latest` pull duoc tu VPS.
