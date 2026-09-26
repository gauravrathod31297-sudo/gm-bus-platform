
const ADMIN_BASE = process.env.ADMIN_URL || 'http://localhost:8091';
const CLIENT_BASE = process.env.CLIENT_URL || 'http://localhost:8081';

const adminNotification = (req) => ({
  subject: 'New Signup Request - ' + (req.company_name || req.name),
  html: [
    '<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">',
    '<div style="background:#fff;border-radius:12px;padding:24px;">',
    '<h2 style="color:#1e40af;">🆕 New Signup Request</h2>',
    '<p>एक नवीन client ने signup केलं आहे:</p>',
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;">',
    '<tr><td style="padding:8px;background:#f3f4f6;font-weight:600;">Name</td><td style="padding:8px;">' + req.name + '</td></tr>',
    '<tr><td style="padding:8px;background:#f3f4f6;font-weight:600;">Email</td><td style="padding:8px;">' + req.email + '</td></tr>',
    '<tr><td style="padding:8px;background:#f3f4f6;font-weight:600;">Phone</td><td style="padding:8px;">' + (req.phone || '-') + '</td></tr>',
    '<tr><td style="padding:8px;background:#f3f4f6;font-weight:600;">Company</td><td style="padding:8px;">' + (req.company_name || '-') + '</td></tr>',
    '<tr><td style="padding:8px;background:#f3f4f6;font-weight:600;">City</td><td style="padding:8px;">' + (req.city || '-') + '</td></tr>',
    '</table>',
    '<a href="' + ADMIN_BASE + '/signup-requests" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Review करा</a>',
    '<p style="color:#6b7280;font-size:13px;margin-top:24px;">Request ID: #' + req.id + '</p>',
    '</div></div>',
  ].join(''),
});

const clientConfirmation = (req) => ({
  subject: 'आम्हाला तुमचा signup request मिळाला - GM Bus Service',
  html: [
    '<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">',
    '<div style="background:#fff;border-radius:12px;padding:32px;">',
    '<h2 style="color:#166534;">✅ Signup Request Received</h2>',
    '<p>नमस्कार <strong>' + req.name + '</strong>,</p>',
    '<p>तुमचा request आमच्याकडे प्राप्त झाला.</p>',
    '<div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:8px;margin:20px 0;">',
    '<p style="margin:0;color:#1e40af;">⏳ आमचा team 24-48 तासांत review करेल.</p>',
    '</div>',
    '<p>Request ID: <strong>#' + req.id + '</strong></p>',
    '<p style="color:#6b7280;font-size:12px;margin-top:24px;">GM Bus Service Team</p>',
    '</div></div>',
  ].join(''),
});

const clientApproval = (client, tempPassword) => ({
  subject: 'तुमचं account तयार आहे - GM Bus Service',
  html: [
    '<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">',
    '<div style="background:#fff;border-radius:12px;padding:32px;">',
    '<h2 style="color:#166534;">🎉 Welcome to GM Bus Service!</h2>',
    '<p>नमस्कार <strong>' + client.name + '</strong>,</p>',
    '<p>तुमचा signup request approve झाला आहे!</p>',
    '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:24px 0;">',
    '<p style="margin:0 0 12px;color:#166534;font-weight:700;">🔐 Login details:</p>',
    '<p>URL: <a href="' + CLIENT_BASE + '/login">' + CLIENT_BASE + '/login</a></p>',
    '<p>Email: <code>' + client.email + '</code></p>',
    '<p>Password: <code>' + (tempPassword || 'OTP ने login करा') + '</code></p>',
    '</div>',
    '<p style="color:#dc2626;font-size:13px;">⚠️ पहिल्या login नंतर password बदला.</p>',
    '<a href="' + CLIENT_BASE + '/login" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Login करा</a>',
    '</div></div>',
  ].join(''),
});

const clientRejection = (req, reason) => ({
  subject: 'Signup request update - GM Bus Service',
  html: [
    '<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">',
    '<div style="background:#fff;border-radius:12px;padding:32px;">',
    '<h2 style="color:#dc2626;">Signup Request Update</h2>',
    '<p>नमस्कार ' + req.name + ',</p>',
    '<p>तुमचा signup request approve करता आलेला नाही.</p>',
    reason ? '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:16px 0;"><p><strong>कारण:</strong> ' + reason + '</p></div>' : '',
    '<p style="color:#6b7280;">अधिक माहितीसाठी admin ला email करा.</p>',
    '</div></div>',
  ].join(''),
});

module.exports = { adminNotification, clientConfirmation, clientApproval, clientRejection };
