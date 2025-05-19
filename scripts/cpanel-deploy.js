/**
 * cPanel Deployment Helper Script
 * ---------------------------------
 * This script creates the necessary files for proper cPanel deployment, including:
 * 1. Custom server.js to run Next.js in production
 * 2. .htaccess file for proper routing
 * 3. .user.ini file to set PHP settings (if needed)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the .next directory exists
if (!fs.existsSync(path.join(__dirname, '..', '.next'))) {
  console.error('Error: .next directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Create server.js for cPanel
const serverJsContent = `
const express = require('express');
const next = require('next');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Use NODE_ENV from environment or default to production
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Enable gzip compression
  server.use(compression());

  // Serve static files from the public directory
  server.use(express.static(path.join(__dirname, 'public')));

  // Handle all requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://localhost:\${port}\`);
    // Log additional info for debugging in cPanel
    console.log(\`> Mode: \${dev ? 'development' : 'production'}\`);
    console.log(\`> Node version: \${process.version}\`);
    console.log(\`> Environment: \${process.env.NODE_ENV}\`);
  });
}).catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
`;

// Create .htaccess for cPanel
const htaccessContent = `
# Enable rewriting
RewriteEngine On

# Only apply to requests to your Node.js app
RewriteBase /

# If the request is for an actual file, directory, or symbolic link, don't rewrite
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Serve files from the public directory
RewriteRule ^public/(.*)$ public/$1 [L]

# Forward all other requests to your Node.js app
RewriteRule ^(.*)$ http://127.0.0.1:$PORT/$1 [P,L]

# PHP settings - only needed if your app uses PHP as well
<IfModule mod_php7.c>
    php_value upload_max_filesize 64M
    php_value post_max_size 64M
    php_value max_execution_time 300
    php_value max_input_time 300
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
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
`;

// Create .user.ini for PHP settings
const userIniContent = `
; Increase file upload size
upload_max_filesize = 64M
post_max_size = 64M

; Increase PHP memory limit
memory_limit = 256M

; Increase execution time
max_execution_time = 300
max_input_time = 300
`;

// Directory paths
const ROOT_DIR = path.join(__dirname, '..');
const SERVER_JS_PATH = path.join(ROOT_DIR, 'server.js');
const HTACCESS_PATH = path.join(ROOT_DIR, '.htaccess');
const USER_INI_PATH = path.join(ROOT_DIR, '.user.ini');

// Write files
console.log('Creating server.js...');
fs.writeFileSync(SERVER_JS_PATH, serverJsContent.trim());

console.log('Creating .htaccess...');
fs.writeFileSync(HTACCESS_PATH, htaccessContent.trim());

console.log('Creating .user.ini...');
fs.writeFileSync(USER_INI_PATH, userIniContent.trim());

console.log('\n✅ Deployment files created successfully.');
console.log('\nTo deploy on cPanel:');
console.log('1. Create a zip file with your project files (excluding node_modules)');
console.log('2. Upload to your cPanel account');
console.log('3. Set up Node.js application in cPanel');
console.log('4. Set the Application startup file to "server.js"');
console.log('5. Install dependencies with "npm install --production"');
console.log('6. Start your application\n');

// Optional: check if build can be created
try {
  console.log('Checking build...');
  execSync('next build', { cwd: ROOT_DIR, stdio: 'inherit' });
  console.log('\n✅ Build successful. Your application is ready for deployment.');
} catch (error) {
  console.error('\n❌ Build failed. Please fix the errors before deploying.');
  process.exit(1);
} 