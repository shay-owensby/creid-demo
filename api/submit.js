/**
 * Lead capture endpoint for the landing page.
 *
 * Submissions are recorded as structured LEAD_SUBMISSION lines in the
 * Vercel runtime logs, where they are collected and relayed to Slack.
 * If a SLACK_WEBHOOK_URL env var is configured on the project, each
 * submission is also posted to Slack directly.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, phone, company } = req.body || {};

  // Honeypot field — bots fill it, humans never see it.
  if (company) {
    res.status(200).json({ ok: true });
    return;
  }

  const cleanName = String(name || '').trim().slice(0, 200);
  const cleanEmail = String(email || '').trim().slice(0, 200);
  const cleanPhone = String(phone || '').trim().slice(0, 50);

  if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Name and a valid email are required' });
    return;
  }

  const lead = {
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone || null,
    at: new Date().toISOString(),
  };

  console.log('LEAD_SUBMISSION ' + JSON.stringify(lead));

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `New signup: *${lead.name}* — ${lead.email}${lead.phone ? ' — ' + lead.phone : ''}`,
        }),
      });
    } catch (err) {
      console.error('Slack webhook failed:', err.message);
    }
  }

  res.status(200).json({ ok: true });
};
