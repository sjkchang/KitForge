import '@kit/env'; // Load environment variables
import { auth } from '../src/lib/auth';
import { getUserRepository } from '../src/repositories';

async function seed() {
    console.log('🌱 Seeding database...');

    // Check if admin user already exists
    const adminEmail = 'admin@example.com';
    const existingAdmin = await getUserRepository().findByEmail(adminEmail);

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
        return;
    }

    // Create admin user using better-auth
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: 'admin123',
                name: 'Admin User',
            },
        });

        if (!result) {
            throw new Error('Failed to create admin user');
        }

        // Update user role to admin
        const createdUser = await getUserRepository().findByEmail(adminEmail);
        if (createdUser) {
            await getUserRepository().updateRole(createdUser.id, 'admin');
        }

        console.log('✅ Admin user created successfully');
        console.log('📧 Email: admin@example.com');
        console.log('🔑 Password: admin123');
        console.log('⚠️  Please change this password in production!');
    } catch (error) {
        console.error('❌ Failed to seed database:', error);
        process.exit(1);
    }
}

seed()
    .then(() => {
        console.log('✨ Seeding complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
