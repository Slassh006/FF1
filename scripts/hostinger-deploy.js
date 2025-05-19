/**
 * Hostinger Deployment Helper Script
 * ---------------------------------
 * This script prepares your Next.js application for deployment on Hostinger:
 * 1. Updates server.js for Hostinger environment
 * 2. Creates necessary configuration files
 * 3. Tests MongoDB connection
 * 4. Provides deployment instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the .next directory exists
if (!fs.existsSync(path.join(__dirname, '..', '.next'))) {
  console.error('Error: .next directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Create server.js optimized for Hostinger
const serverJsContent = `
const express = require('express');
const next = require('next');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  require('dotenv').config();
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Connection to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thefreefireindia';

async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Use NODE_ENV from environment or default to production
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

async function prepareServer() {
  try {
    // Connect to MongoDB
    const mongoConnected = await connectMongo();
    if (!mongoConnected) {
      console.warn('⚠️ Server starting without MongoDB connection. Some features may not work.');
    }

    // Prepare Next.js
    await app.prepare();
    const server = express();

    // Middleware
    server.use((req, res, next) => {
      // Simple request logger
      console.log(\`\${new Date().toISOString()} \${req.method} \${req.url}\`);
      next();
    });

    // Enable gzip compression
    server.use(compression());

    // Parse JSON requests
    server.use(express.json({ limit: '50mb' }));
    server.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Serve static files from the public directory
    server.use(express.static(path.join(__dirname, 'public')));

    // Add CORS headers for API routes
    server.use('/api', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });

    // Health check endpoint
    server.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Global error handler
    server.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Handle all requests with Next.js
    server.all('*', (req, res) => {
      return handle(req, res);
    });

    // Start the server
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(\`> Server ready on http://localhost:\${port}\`);
      console.log(\`> Mode: \${dev ? 'development' : 'production'}\`);
      console.log(\`> Node version: \${process.version}\`);
      console.log(\`> MongoDB: \${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\`);
    });

    // Handle process termination
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Start the server
prepareServer();
`;

// Create .htaccess for Hostinger
const htaccessContent = `
# Redirect to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Don't show directory listings
Options -Indexes

# Set default handler
DirectoryIndex index.html index.php server.js

# Enable Node.js handler
<FilesMatch "server\\.js$">
    SetHandler "proxy:unix:/tmp/node-runner.sock|http://localhost"
</FilesMatch>

# Serve files from the public directory
RewriteCond %{REQUEST_URI} ^/public/
RewriteRule ^public/(.*)$ public/$1 [L]

# Forward all requests to server.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ server.js [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Set caching for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType video/mp4 "access plus 1 year"
    ExpiresByType video/webm "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;

// Create a sample .env.production for Hostinger
const envProductionContent = `
# Production Environment Variables
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thefreefireindia
# Replace with actual values for your Hostinger deployment
JWT_SECRET=your-jwt-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
`;

// Directory paths
const ROOT_DIR = path.join(__dirname, '..');
const SERVER_JS_PATH = path.join(ROOT_DIR, 'server.js');
const HTACCESS_PATH = path.join(ROOT_DIR, '.htaccess');
const ENV_PRODUCTION_PATH = path.join(ROOT_DIR, '.env.production.sample');

// Write files
console.log('Creating server.js...');
fs.writeFileSync(SERVER_JS_PATH, serverJsContent.trim());

console.log('Creating .htaccess...');
fs.writeFileSync(HTACCESS_PATH, htaccessContent.trim());

console.log('Creating .env.production.sample...');
fs.writeFileSync(ENV_PRODUCTION_PATH, envProductionContent.trim());

console.log('\n✅ Deployment files created successfully.');

// Test MongoDB connection
try {
  console.log('\nTesting MongoDB connection...');
  execSync('node scripts/test-connection.js', { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (error) {
  console.warn('\n⚠️ MongoDB connection test failed. Please check your connection settings.');
}

// Create deployment instructions
console.log('\n📋 Hostinger Deployment Instructions:');
console.log('1. Log in to your Hostinger control panel');
console.log('2. Go to "Website" > "Hosting" > Select your hosting plan');
console.log('3. Upload your project files to the public_html directory (excluding node_modules)');
console.log('4. Create a .env file with your production environment variables');
console.log('5. In the Hostinger SSH terminal, navigate to your project directory and run:');
console.log('   npm install --production');
console.log('   npm run build');
console.log('   npm run init-db');
console.log('6. Set up a Node.js application in Hostinger:');
console.log('   - Application URL: Your domain');
console.log('   - Application root: /public_html');
console.log('   - Application startup file: server.js');
console.log('7. Start the application and ensure it\'s running');
console.log('\n💡 Tips:');
console.log('- Ensure you have created a MongoDB database and updated the connection string');
console.log('- Check server logs if you encounter any issues');
console.log('- For domain configuration, point your domain to Hostinger nameservers');
console.log('- Set up SSL certificate for HTTPS access\n'); 