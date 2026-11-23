'use strict';
const { db, now } = require('./db');

// Ohereza SMS. Buri butumwa bubikwa muri "sms_outbox" kugira ngo ubuyobozi bubone ibyoherejwe.
async function send(to, message, logMessage = message) {
  const id = Number(db.prepare('INSERT INTO sms_outbox(to_phone,message,status,created_at) VALUES(?,?,?,?)').run(to, logMessage, 'queued', now()).lastInsertRowid);
  const set = (status, response = '') => db.prepare('UPDATE sms_outbox SET status=?, response=? WHERE id=?').run(status, String(response).slice(0, 500), id);
  try {
    const provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    if (provider === 'africastalking') {
      // Reba inyandiko za Africa's Talking mbere yo gutangira gukoresha (aderesi n'imirima bishobora guhinduka).
      const sandbox = (process.env.AT_USERNAME || '') === 'sandbox';
      const url = `https://api.${sandbox ? 'sandbox.' : ''}africastalking.com/version1/messaging`;
      const body = new URLSearchParams({ username: process.env.AT_USERNAME || '', to, message });
      if (process.env.AT_SENDER_ID) body.set('from', process.env.AT_SENDER_ID);
      const r = await fetch(url, {
        method: 'POST',
        headers: { apiKey: process.env.AT_API_KEY || '', Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const text = await r.text();
      set(r.ok ? 'sent' : 'failed', text);
    } else {
      console.log(`[SMS:console] -> ${to}: ${message}`);
      set('logged');
    }
  } catch (e) { set('failed', e.message); }
  return id;
}
module.exports = { send };
