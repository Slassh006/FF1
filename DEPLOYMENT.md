# Deployment Guide for TheFreeFireIndia

This guide outlines the steps to deploy the application on a Node.js VPS using GitHub.

## Prerequisites

- A VPS with Node.js v18+ installed
- Git installed on the VPS
- MongoDB instance (either local or cloud-based)
- Domain name (optional, but recommended)

## Step 1: Prepare Your Repository

1. Ensure your `.env` file is not committed to the repository
2. Create a `.env.example` file with placeholder values
3. Update your `.gitignore` file to exclude sensitive files

## Step 2: Set Up Your VPS

1. Connect to your VPS via SSH
2. Install Node.js v18+ if not already installed:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Install PM2 for process management:
   ```bash
   sudo npm install -g pm2
   ```
4. Install Git if not already installed:
   ```bash
   sudo apt-get update
   sudo apt-get install git
   ```

## Step 3: Clone Your Repository

```bash
cd /var/www
git clone https://github.com/yourusername/thefreefireindia.git
cd thefreefireindia
```

## Step 4: Set Up Environment Variables

Create a `.env` file with your production settings:

```bash
nano .env
```

Add the following (replace with your actual values):

```
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://yourdomain.com"
JWT_SECRET="your-jwt-secret-here"
MONGODB_URI="your-mongodb-connection-string"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NODE_ENV="production"
PORT=3000
EMAIL_SERVER_HOST="your-email-server"
EMAIL_SERVER_PORT="your-email-port"
EMAIL_SERVER_USER="your-email-username"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="your-email-from-address"
```

## Step 5: Install Dependencies and Build

```bash
npm install
npm run build
```

## Step 6: Set Up PM2 for Process Management

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: 'thefreefireindia',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.js
```

Set up PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

## Step 7: Set Up Nginx as a Reverse Proxy (Optional)

If you want to use Nginx as a reverse proxy:

1. Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```

2. Create a Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/thefreefireindia
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/thefreefireindia /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 8: Set Up SSL with Let's Encrypt (Optional)

If you want to use HTTPS:

1. Install Certbot:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. Obtain an SSL certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. Follow the prompts to complete the setup.

## Step 9: Set Up Automatic Deployment (Optional)

To set up automatic deployment when you push to GitHub:

1. Create a deployment script:
   ```bash
   nano deploy.sh
   ```

2. Add the following:
   ```bash
   #!/bin/bash
   cd /var/www/thefreefireindia
   git pull
   npm install
   npm run build
   pm2 restart thefreefireindia
   ```

3. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Set up a GitHub webhook to trigger this script when you push to your repository.

## Troubleshooting

- Check logs: `pm2 logs thefreefireindia`
- Restart the application: `pm2 restart thefreefireindia`
- Check MongoDB connection: Ensure your MongoDB instance is accessible from your VPS
- Check environment variables: Make sure all required environment variables are set correctly

## Maintenance

- Update dependencies: `npm update`
- Rebuild the application: `npm run build`
- Restart the application: `pm2 restart thefreefireindia`
- Monitor the application: `pm2 monit` 