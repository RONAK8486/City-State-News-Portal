const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

// Configure the transport layer using standard variables or fallback to Ethereal tests
const createTransporter = async () => {
  if (process.env.SMTP_HOST === 'smtp.ethereal.email' && (!process.env.SMTP_USER || process.env.SMTP_USER === 'test@ethereal.email')) {
    const testAccount = await nodemailer.createTestAccount();
    process.env.SMTP_USER = testAccount.user;
    process.env.SMTP_PASS = testAccount.pass;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─────────────────────────────────────────
// Welcome Email
// ─────────────────────────────────────────
exports.sendWelcomeEmail = async (user) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"News Portal Team" <${process.env.SMTP_USER || 'no-reply@newsportal.com'}>`,
      to: user.email,
      subject: "Welcome to News Portal — You're in! 🎉",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; color: #333; line-height: 1.6; }
          .content p { margin-bottom: 15px; }
          .btn { display: inline-block; background-color: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }
          .footer a { color: #2563eb; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to News Portal! 🎉</h1></div>
          <div class="content">
            <p>Hi ${user.name.split(' ')[0]},</p>
            <p>We are absolutely thrilled to have you onboard! News Portal is your new home for breaking stories, verified journalism, and active community discussions.</p>
            <p>You can now save your favorite articles, comment on developing stories, and customize your newsfeed directly from your profile.</p>
            <center><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" class="btn">Explore Top Stories</a></center>
            <p>Best regards,<br>The News Portal Team</p>
          </div>
          <div class="footer">
            <p>You received this because you signed up at News Portal.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/">Website</a> | <a href="#">Privacy Policy</a></p>
            <p>&copy; ${new Date().getFullYear()} News Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`
    };

    const info = await transporter.sendMail(mailOptions);

    await EmailLog.create({ user: user._id, toEmail: user.email, subject: mailOptions.subject, status: 'sent' });

    console.log(`Welcome email sent to ${user.email} (MessageId: ${info.messageId})`);
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal Preview URL: ' + previewUrl);
      return previewUrl;
    }
    return null;

  } catch (error) {
    console.error('Failed to dispatch welcome email:', error.message);
    try {
      await EmailLog.create({ user: user._id, toEmail: user.email, subject: "Welcome to News Portal — You're in! 🎉", status: 'failed', errorDetails: error.message });
    } catch (dbError) {
      console.error('CRITICAL: Failed to write to EmailLog DB: ', dbError.message);
    }
  }
};

// ─────────────────────────────────────────
// OTP Password Reset Email
// ─────────────────────────────────────────
exports.sendOtpEmail = async (email, otp) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"City-State News Portal" <${process.env.SMTP_USER || 'no-reply@newsportal.com'}>`,
      to: email,
      subject: '🔐 Your OTP for Password Reset — City-State News Portal',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; padding: 40px 16px; }
          .wrapper { max-width: 520px; margin: 0 auto; }
          .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 36px 32px 28px; text-align: center; }
          .logo-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 28px; }
          .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
          .body { padding: 36px 32px; }
          .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
          .info-text { font-size: 14px; color: #6b7280; line-height: 1.7; margin-bottom: 28px; }
          .otp-label { font-size: 12px; font-weight: 700; color: #9ca3af; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; text-align: center; }
          .otp-box { background: #f0f9ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px; }
          .otp-code { font-size: 52px; font-weight: 900; color: #1d4ed8; letter-spacing: 14px; line-height: 1; font-family: 'Courier New', monospace; }
          .otp-expiry { font-size: 12px; color: #6b7280; margin-top: 12px; }
          .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
          .warning-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
          .warning-box p { font-size: 13px; color: #92400e; line-height: 1.6; }
          .warning-box strong { color: #c2410c; }
          .rules { list-style: none; padding: 0; margin-bottom: 24px; }
          .rules li { font-size: 13px; color: #6b7280; padding: 4px 0 4px 16px; position: relative; line-height: 1.5; }
          .rules li::before { content: '•'; color: #3b82f6; font-weight: 700; position: absolute; left: 0; }
          .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="logo-icon">📰</div>
              <h1>Password Reset OTP</h1>
              <p>City-State News Portal Security</p>
            </div>
            <div class="body">
              <p class="greeting">Hello,</p>
              <p class="info-text">
                We received a request to reset the password for your account. Use the one-time password below to proceed. If you did not request this, you can safely ignore this email — your password will not be changed.
              </p>
              <p class="otp-label">Your Verification Code</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p class="otp-expiry">⏱ Valid for <strong>10 minutes</strong> only</p>
              </div>
              <hr class="divider">
              <div class="warning-box">
                <p><strong>⚠️ Do not share this OTP</strong> with anyone, including our support team. We will never ask for your OTP. This code is single-use and will expire after one successful verification.</p>
              </div>
              <ul class="rules">
                <li>This OTP expires 10 minutes from the time of this email.</li>
                <li>Maximum 3 attempts allowed — the code is invalidated after 3 wrong attempts.</li>
                <li>Only 3 OTP requests are allowed per hour per account.</li>
                <li>If this wasn't you, your password remains unchanged.</li>
              </ul>
            </div>
            <div class="footer">
              <p>This email was sent from <strong>City-State News Portal</strong>.<br>
              If this wasn't you, please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">sign in</a> and secure your account immediately.</p>
              <p style="margin-top:8px">&copy; ${new Date().getFullYear()} City-State News Portal. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email} (MessageId: ${info.messageId})`);

    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal OTP Preview URL: ' + previewUrl);
      return previewUrl;
    }
    return null;

  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    throw error;
  }
};
