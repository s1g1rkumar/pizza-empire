# Pizza Empire Tycoon — Production Deployment Guide (Ubuntu Linux)

Complete production runbook for deploying **Pizza Empire Tycoon** (`React + Vite`, `Node.js + Express + TypeScript`, `MySQL 8`) on an Ubuntu 22.04/24.04 LTS server.

> **Security Rule:** Never commit `.env` files, private keys, or database passwords. Use [backend/.env.production.example](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/.env.production.example) and [frontend/.env.production.example](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/frontend/.env.production.example) as templates on the server only.

---

## 1. Ubuntu Server Provisioning & Security Baseline

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server certbot python3-certbot-nginx ufw fail2ban

# Install Node.js 22 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Configure UFW Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 2. MySQL 8 Configuration & Least-Privilege User

```bash
sudo mysql_secure_installation
```

Create the production database and dedicated least-privilege application user:

```sql
CREATE DATABASE pizza_empire_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pizza_empire_app'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON pizza_empire_prod.* TO 'pizza_empire_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Create `~/.my.cnf` (`chmod 600 ~/.my.cnf`) for passwordless automated backups without embedding secrets in scripts:

```ini
[mysqldump]
user=pizza_empire_app
password=REPLACE_WITH_STRONG_PASSWORD
host=127.0.0.1
```

---

## 3. Production Environment Configuration

```bash
sudo mkdir -p /var/www/pizza-empire /var/log/pizza-empire /var/backups/pizza-empire
sudo chown -R "$USER":"$USER" /var/www/pizza-empire /var/log/pizza-empire /var/backups/pizza-empire

git clone <YOUR_REPO_URL> /var/www/pizza-empire
cd /var/www/pizza-empire

cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production
chmod 600 backend/.env frontend/.env.production

# Generate strong JWT secrets:
openssl rand -hex 64
```

Edit `backend/.env` and `frontend/.env.production` with your real domain, DB credentials, and generated JWT secrets.

---

## 4. Build Backend, Migrate & Seed Database, Build Frontend

```bash
# Backend build & migrations
cd /var/www/pizza-empire/backend
npm ci
npm run build
npm run migrate
npm run seed

# Frontend production bundle
cd /var/www/pizza-empire/frontend
npm ci
npm run build
```

---

## 5. PM2 Process Management, Logs & Monitoring

PM2 runs `backend/dist/server.js` using [deploy/ecosystem.config.cjs](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/deploy/ecosystem.config.cjs) (`instances: 1`, `exec_mode: 'fork'` so the in-process `SimulationScheduler` never runs duplicate ticks).

```bash
cd /var/www/pizza-empire
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

### Log Rotation & Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
pm2 monit
curl -fsS http://127.0.0.1:4000/api/v1/health
```

---

## 6. Nginx Domain Routing, Security Headers & HTTPS

Copy [deploy/nginx/pizza-empire.conf](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/deploy/nginx/pizza-empire.conf), replace `pizzaempire.example.com` with your domain, enable the site, and issue a Let's Encrypt TLS certificate:

```bash
sudo cp /var/www/pizza-empire/deploy/nginx/pizza-empire.conf /etc/nginx/sites-available/pizza-empire.conf
sudo ln -s /etc/nginx/sites-available/pizza-empire.conf /etc/nginx/sites-enabled/pizza-empire.conf
sudo nginx -t && sudo systemctl reload nginx

# Provision HTTPS certificate and auto-renewal
sudo certbot --nginx -d pizzaempire.example.com -d www.pizzaempire.example.com
sudo certbot renew --dry-run
```

---

## 7. Automated Daily Database Backups

Install a daily cron job using [deploy/scripts/backup_mysql.sh](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/deploy/scripts/backup_mysql.sh) (retains 14 days of `.sql.gz` backups):

```bash
chmod +x /var/www/pizza-empire/deploy/scripts/*.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/pizza-empire/deploy/scripts/backup_mysql.sh >> /var/log/pizza-empire/backup.log 2>&1") | crontab -
```

---

## 8. CI/CD & Deployment Automation

1. GitHub Actions workflow ([.github/workflows/ci-cd.yml](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/.github/workflows/ci-cd.yml)) runs `npm test`, `npm run build`, and `npm run lint` on every push/PR to `main`.
2. To enable automated SSH deployment on push to `main`, set repository variable `DEPLOY_ENABLED=true` and secrets `PROD_SERVER_HOST`, `PROD_SERVER_USER`, and `PROD_SSH_PRIVATE_KEY`.
3. Manual server deploy:

```bash
bash /var/www/pizza-empire/deploy/scripts/deploy.sh
```

---

## 9. Rollback Strategy

`deploy.sh` automatically records the previous commit hash in `.last_good_commit` and creates a pre-deploy MySQL backup.

1. **Application Rollback (Zero-Data-Loss Code Revert):**

```bash
bash /var/www/pizza-empire/deploy/scripts/rollback.sh
# Or specify an explicit tag/commit:
bash /var/www/pizza-empire/deploy/scripts/rollback.sh <commit-or-tag>
```

2. **Database Restore (If a Migration Must Be Reverted):**

```bash
gunzip -c /var/backups/pizza-empire/pizza_empire_prod_YYYYMMDD_HHMMSS.sql.gz | mysql pizza_empire_prod
```

---

## 10. Docker Usage (Development & Optional Production)

- **Development Stack:**

```bash
docker compose up --build
```

- **Optional Production Stack:**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
