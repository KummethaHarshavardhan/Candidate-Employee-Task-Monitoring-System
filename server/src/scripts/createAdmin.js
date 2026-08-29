const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL;
  const password = args[1] || process.env.ADMIN_PASSWORD;
  const name = args[2] || process.env.ADMIN_NAME || 'System Administrator';
  const role = (args[3] || 'ADMIN').toUpperCase();

  if (!email || !password) {
    console.error('Usage: node src/scripts/createAdmin.js <email> <password> [name] [role]');
    console.error('Example: node src/scripts/createAdmin.js admin@company.com mySecurePass123 "Main Admin" ADMIN');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/candidate_task_monitoring_db';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log(`Updating existing user (${email}) role to ${role}...`);
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = role;
      await existingUser.save();
      console.log(`User ${email} updated successfully as ${role}.`);
    } else {
      await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        role,
        team: role === 'ADMIN' ? 'Management' : 'Technical Review',
      });
      console.log(`User ${email} (${name}) created successfully as ${role}.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
};

createAdmin();
