#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Navigate to the project directory
cd /var/www/thefreefireindia

# Pull the latest changes
echo "Pulling latest changes from GitHub..."
git pull

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Restart the application
echo "Restarting the application..."
pm2 restart thefreefireindia

echo "Deployment completed successfully!" 