const nodemailer = require('nodemailer');

const getTransporter = () => {
  const email = process.env.EMAIL ? process.env.EMAIL.trim() : '';
  const emailPassRaw = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  const emailPass = emailPassRaw ? emailPassRaw.trim().replace(/\s+/g, '') : '';
  const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : '';

  const authUser = email || smtpUser;
  const authPass = emailPass;

  if (!authUser || !authPass) {
    return null;
  }

  // Custom SMTP server configuration (if not placeholder)
  if (smtpHost && !smtpHost.includes('yourcompany.com')) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: authUser,
        pass: authPass,
      },
    });
  }

  // Standard Gmail transport
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: authUser,
      pass: authPass,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email transporter is not configured. Please check EMAIL and EMAIL_PASS in backend .env.');
  }
  if (!to) {
    throw new Error('No recipient email address specified.');
  }

  const from = process.env.EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER;

  return await transporter.sendMail({
    from: `"Task Management System" <${from}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
};

const sendEmailSafely = async (mail) => {
  try {
    await sendEmail(mail);
    console.log(`[Email] Assignment email sent successfully to ${mail.to}`);
    return true;
  } catch (error) {
    console.error(`[Email] Email sending failed to ${mail.to}:`, error.message);
    return false;
  }
};

module.exports = { sendEmailSafely, sendEmail };