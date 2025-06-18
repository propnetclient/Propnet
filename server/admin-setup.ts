import { adminAuth } from './admin-auth';
import { db } from './db';
import { adminUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setupInitialAdmin() {
  try {
    // Check if any admin users exist
    const existingAdmins = await db.select().from(adminUsers).limit(1);
    
    if (existingAdmins.length > 0) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create initial admin user
    const result = await adminAuth.createAdmin(
      'admin',
      'SecureAdmin123!@#',
      'admin@propnet.com'
    );

    if (result.success) {
      console.log('✓ Initial admin user created successfully');
      console.log('  Username: admin');
      console.log('  Password: SecureAdmin123!@#');
      console.log('  Access: /admin/login');
      console.log('');
      console.log('⚠️  IMPORTANT: Change the default password after first login!');
    } else {
      console.error('✗ Failed to create admin user:', result.message);
    }
  } catch (error) {
    console.error('✗ Admin setup error:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupInitialAdmin().then(() => process.exit(0));
}

export { setupInitialAdmin };