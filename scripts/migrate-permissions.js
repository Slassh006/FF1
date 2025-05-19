const path = require('path');
require('dotenv').config();

const { connectDB } = require('../dist/lib/db.js');
const User = require('../dist/models/User.js');

async function migratePermissions() {
  try {
    console.log('Starting permissions migration...');
    await connectDB();
    
    // Update admin users
    const adminResult = await User.updateMany(
      { role: 'admin' },
      { 
        $set: { 
          isAdmin: true,
          permissions: [
            'read:blogs',
            'write:blogs',
            'read:wallpapers',
            'write:wallpapers',
            'read:users',
            'write:users',
            'read:orders',
            'write:orders',
            'manage:settings'
          ]
        }
      }
    );
    
    console.log(`Updated ${adminResult.modifiedCount} admin users`);
    
    // Update normal users
    const userResult = await User.updateMany(
      { role: 'user' },
      { 
        $set: { 
          isAdmin: false,
          permissions: [
            'read:blogs',
            'read:wallpapers'
          ]
        }
      }
    );
    
    console.log(`Updated ${userResult.modifiedCount} normal users`);
    
    // Ensure all users have a role
    const noRoleResult = await User.updateMany(
      { role: { $exists: false } },
      { 
        $set: { 
          role: 'user',
          isAdmin: false,
          permissions: [
            'read:blogs',
            'read:wallpapers'
          ]
        }
      }
    );
    
    console.log(`Updated ${noRoleResult.modifiedCount} users with no role`);
    
    console.log('Permissions migration completed successfully');
  } catch (error) {
    console.error('Error during permissions migration:', error);
  } finally {
    process.exit(0);
  }
}

migratePermissions(); 