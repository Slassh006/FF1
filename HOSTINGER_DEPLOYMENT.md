# Deploying TheFreeFireIndia to Hostinger

This guide provides step-by-step instructions for deploying your Next.js application to Hostinger hosting service.

## Prerequisites

- Hostinger hosting account with Node.js support
- MongoDB database (either MongoDB Atlas or a compatible MongoDB service)
- Domain name configured to point to your Hostinger hosting

## Deployment Steps

### 1. Prepare Your Application

Make sure your application is optimized for production:

```bash
# Install dependencies
npm install

# Run the hostinger deployment script
npm run hostinger-deploy
```

This will:
- Build your Next.js application
- Create necessary configuration files
- Test your MongoDB connection
- Generate deployment instructions

### 2. Configure Environment Variables

You need to create a `.env` file in your project root with all required environment variables:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://freefireindia:freefireindia123@cluster0.mongodb.net/thefreefireindia?retryWrites=true&w=majority
JWT_SECRET=your-secure-jwt-secret

```

> **Important**: Replace placeholders with your actual credentials.

### 3. Upload Files to Hostinger

1. Log in to your Hostinger Control Panel
2. Navigate to File Manager or use FTP client to connect to your hosting
3. Upload your project files to the `public_html` directory, excluding:
   - `node_modules` directory
   - `.git` directory
   - Any development-specific files

### 4. Set Up Node.js Application in Hostinger

1. In your Hostinger Control Panel, navigate to "Website" > "Hosting" section
2. Find the Node.js Application menu
3. Create a new Node.js application with the following settings:
   - **Application URL**: Your domain (e.g., thefreefireindia.com)
   - **Application root directory**: `/public_html`
   - **Application startup file**: `server.js`
   - **Node.js version**: Select the latest LTS version

### 5. Install Dependencies & Initialize Database

Connect to your Hostinger hosting via SSH and run:

```bash
cd public_html
npm install --production
npm run init-db
```

### 6. Start Your Application

Start your Node.js application through the Hostinger Control Panel.

### 7. Verify Deployment

1. Visit your domain in a web browser to ensure the application is working correctly
2. Check the `/health` endpoint (e.g., https://yourdomain.com/health) to verify server status
3. Test the admin panel by navigating to `/admin/login`

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection errors:

1. Verify your connection string in the `.env` file
2. Ensure your IP address is whitelisted in MongoDB Atlas (if using Atlas)
3. Check if your MongoDB user has the correct permissions
4. Run `npm run test-mongodb` to test the connection

### Application Not Starting

If your application fails to start:

1. Check the Node.js application logs in Hostinger
2. Verify that all dependencies are installed correctly
3. Make sure your `server.js` file is in the root directory
4. Check if the port configuration matches Hostinger's requirements

### File Upload Issues

If you encounter issues with file uploads:

1. Verify that Cloudinary credentials are correctly set in your `.env` file
2. Check if temporary directories have proper write permissions
3. Ensure your hosting plan has sufficient storage and bandwidth

## Maintenance

### Updating Your Application

To update your application:

1. Make your changes locally and test thoroughly
2. Run `npm run hostinger-deploy` to prepare the deployment files
3. Upload the updated files to your Hostinger hosting
4. Restart the Node.js application

### Database Backups

Regularly backup your MongoDB database:

1. Through MongoDB Atlas dashboard (if using Atlas)
2. Using `mongodump` command for self-hosted MongoDB
3. Schedule automated backups when possible

### Monitoring

Monitor your application performance:

1. Check server logs regularly
2. Set up uptime monitoring for your domain
3. Monitor MongoDB performance metrics

## Additional Resources

- [Hostinger Node.js Hosting Documentation](https://www.hostinger.com/tutorials/how-to-install-node-on-hostinger)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

## Support

If you encounter any issues during deployment, please:

1. Check the troubleshooting section above
2. Review Hostinger's knowledge base
3. Contact Hostinger support if issues persist 