const express = require('express');
const next = require('next');
const { connectDB } = require('./app/lib/db');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for the access log
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Create a write stream for the error log
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

app.prepare().then(() => {
  const server = express();

  // Connect to MongoDB
  connectDB()
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      errorLogStream.write(`${new Date().toISOString()} - MongoDB connection error: ${err.message}\n`);
    });

  // Log all requests
  server.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    accessLogStream.write(log);
    next();
  });

  // Add CORS headers with environment-specific origin
  const allowedOrigin = process.env.NODE_ENV === 'production' 
    ? process.env.NEXTAUTH_URL // Use the production URL
    : '*'; // Allow all in development

  server.use((req, res, next) => {
    if (allowedOrigin) {
        res.header('Access-Control-Allow-Origin', allowedOrigin);
    }
    // Allow localhost regardless for easier local dev if NEXTAUTH_URL is production URL
    if (process.env.NODE_ENV !== 'production' && req.headers.origin && req.headers.origin.startsWith('http://localhost')) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'); // Added PATCH
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true'); // Often needed with specific origins

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
  });

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handling middleware
  server.use((err, req, res, next) => {
    console.error(err.stack);
    errorLogStream.write(`${new Date().toISOString()} - ${err.stack}\n`);
    res.status(500).json({ error: 'Something broke!' });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 