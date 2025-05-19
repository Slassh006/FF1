const mongoose = require('mongoose');
require('dotenv').config();

const CRAFTLAND_PERMISSIONS = [
  'read:craftland-codes',
  'write:craftland-codes',
  'manage:craftland-codes'
];

async function updateAdminPermissions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    // Find all admin users
    const adminUsers = await mongoose.connection.db
      .collection('users')
      .find({ 
        $or: [
          { role: 'admin' },
          { isAdmin: true }
        ]
      })
      .toArray();

    console.log(`Found ${adminUsers.length} admin users`);

    for (const user of adminUsers) {
      const currentPermissions = user.permissions || [];
      const newPermissions = [...new Set([...currentPermissions, ...CRAFTLAND_PERMISSIONS])];

      await mongoose.connection.db
        .collection('users')
        .updateOne(
          { _id: user._id },
          { 
            $set: { 
              permissions: newPermissions,
              updatedAt: new Date()
            }
          }
        );

      console.log(`✅ Updated permissions for user: ${user.email}`);
      console.log('New permissions:', newPermissions);
    }

    console.log('\n✅ Admin permissions update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

updateAdminPermissions(); 