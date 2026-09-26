const nodemailer = require('nodemailer');

// ─── .env मधून password साठी 2 variants accept करा ───
function getEnvPass() {
  return process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_PWD;
}

// ─── "Name <email>" parse करा किंवा plain email ───
function parseFrom(str, fallbackEmail, fallbackName) {
  if (!str) return { email: fallbackEmail, name: fallbackName };
  // "Name <email@domain>" format
  const m = str.match(/^(?:"?([^"<]*)"?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim() || fallbackName, email: m[2].trim() };
  // plain email
  if (str.includes('@')) return { email: str.trim(), name: fallbackName };
  return { email: fallbackEmail, name: fallbackName };
}

function createTransport(cfg = {}) {
  const host = cfg.host || process.env.SMTP_HOST;
  const port = cfg.port || parseInt(process.env.SMTP_PORT || '587');
  const user = cfg.user || process.env.SMTP_USER;
  const pass = cfg.pass || getEnvPass();
  const secure = cfg.secure !== undefined
    ? cfg.secure
    : (process.env.SMTP_SECURE === 'true' || port === 465);

  if (!host || !user || !pass) {
    throw new Error('SMTP config incomplete - host/user/pass आवश्यक. host=' +
      (host || 'MISSING') + ' user=' + (user || 'MISSING') +
      ' pass=' + (pass ? 'SET' : 'MISSING'));
  }

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

async function sendEmail({ to, subject, html, text, cfg = {} }) {
  const transporter = createTransport(cfg);
  const defaultFrom = process.env.SMTP_FROM;
  const defaultEmail = process.env.SMTP_USER;
  const defaultName = process.env.SMTP_FROM_NAME || 'GM Bus Service';

  const fromEmail = cfg.from_email || defaultEmail;
  const fromName = cfg.from_name || defaultName;
  const parsed = parseFrom(cfg.from || defaultFrom, fromEmail, fromName);
  const from = '"' + parsed.name + '" <' + parsed.email + '>';

  const info = await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });
  console.log('📧 Email sent to ' + to + ' — ' + info.messageId);
  return info;
}


// ════════════════════════════════════════════════════════════
// OTP Email — Marathi + English HTML
// ════════════════════════════════════════════════════════════
async function sendOtpEmail(to, otp, purpose = 'login') {
  const subject = purpose === 'login'
    ? 'तुमचा Login OTP — GM Bus Tracking'
    : 'OTP Verification — GM Bus Tracking';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h1 style="color: #2563eb; margin: 0 0 8px 0; font-size: 24px;">🚌 GM Bus Tracking</h1>
        <p style="color: #6b7280; margin: 0 0 24px 0;">तुमचा one-time password:</p>
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0;">
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: white; font-family: monospace;">${otp}</div>
        </div>
        <p style="color: #374151; margin: 0 0 8px 0;"><strong>महत्त्वाचं:</strong></p>
        <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
          <li>हा OTP 5 मिनिटांसाठी valid आहे</li>
          <li>कोणालाही सांगू नका</li>
          <li>तुम्ही ही request केली नसेल तर ignore करा</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">GM Bus Tracking Team</p>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendOtpEmail, createTransport, getEnvPass, parseFrom };
