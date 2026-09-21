const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  SMTP not ready:', err.message);
  } else {
    console.log('📧 SMTP ready');
  }
});

async function sendMail({ to, subject, html, from }) {
  try {
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Mail sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`📧 Mail failed:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail, transporter };
