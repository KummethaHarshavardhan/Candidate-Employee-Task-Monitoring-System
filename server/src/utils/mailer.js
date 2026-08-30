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
    console.log(`[Email] Email sent successfully to ${mail.to}`);
    return true;
  } catch (error) {
    console.error(`[Email] Email sending failed to ${mail.to}:`, error.message);
    return false;
  }
};

/**
 * Sends a branded password reset email with secure 6-digit OTP code.
 */
const sendPasswordResetOtpEmail = async ({ to, name, otp, expireMinutes = 5 }) => {
  const recipientName = name ? name.trim() : 'User';
  const subject = 'CETMS Password Reset Verification Code';

  const text = `Hello ${recipientName},

We received a request to reset the password for your Candidate & Employee Task Monitoring System (CETMS) account.

Your 6-digit verification code is:
${otp}

This code is valid for ${expireMinutes} minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
CETMS Security Team
IT SPAXIOS INNOVATION`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0f1d; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" style="max-width: 560px; background-color: #1a2234; border: 1px solid #2e3a55; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background-color: #111827; border-bottom: 1px solid #2e3a55; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #818cf8; letter-spacing: 0.5px;">
                IT SPAXIOS INNOVATION
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">
                Candidate & Employee Task Monitoring System
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #f8fafc; font-weight: 600;">
                Password Reset Verification Code
              </h2>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                We received a request to reset your CETMS account password. Enter the 6-digit verification code below to proceed:
              </p>
              <!-- OTP Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #111827; border: 2px dashed #4f46e5; border-radius: 10px; padding: 18px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Expiry Alert -->
              <div style="background-color: rgba(79, 70, 229, 0.1); border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #c7d2fe; line-height: 1.5;">
                  ⏱️ This code will expire in <strong>${expireMinutes} minutes</strong> and can only be used once.
                </p>
              </div>
              <!-- Security Warning -->
              <hr style="border: none; border-top: 1px solid #2e3a55; margin: 24px 0 16px;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                🛡️ <strong>Security Tip:</strong> Never share this verification code with anyone. If you did not request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #111827; border-top: 1px solid #2e3a55; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © ${new Date().getFullYear()} IT SPAXIOS INNOVATION. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendEmailSafely({
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmailSafely, sendEmail, sendPasswordResetOtpEmail };
