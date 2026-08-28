const User = require('../models/User');

/**
 * Automatically creates the initial administrator if no ADMIN user exists.
 * Values are securely read from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME).
 */
const bootstrapAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    if (!adminEmail || !adminPassword) {
      console.log(
        '[Bootstrap] No administrator found in database. You can configure ADMIN_EMAIL and ADMIN_PASSWORD in .env or run `npm run create-admin` to provision an initial administrator.'
      );
      return;
    }

    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'ADMIN',
      team: 'Management',
    });

    console.log(`[Bootstrap] Initial production administrator created: ${adminEmail.toLowerCase().trim()}`);
  } catch (error) {
    console.error(`[Bootstrap Error]: Failed to bootstrap administrator: ${error.message}`);
  }
};

module.exports = bootstrapAdmin;