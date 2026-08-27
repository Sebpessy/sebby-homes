/**
 * Sebby Homes — gallery access gate
 * Routes (api.sebby.homes):
 *   POST /contact  {name,email,phone,location,projectType,timeline,message}
 *                                        -> email owner + acknowledge visitor
 *   POST /request  {name,email,property} -> store + send verification email to visitor
 *   GET  /verify?id&t                    -> mark verified + email owner approve/deny links
 *   GET  /decide?id&t&action             -> owner approves/denies; visitor notified
 *   GET  /check?key                      -> {ok} for the frontend unlock
 *
 * Bindings: GATE (KV), secrets: RESEND_API_KEY
 * Vars: OWNER_EMAIL, FROM_EMAIL, SITE
 */

const SITE = 'https://sebby.homes';
const CORS = {
  'Access-Control-Allow-Origin': SITE,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const tok = () => crypto.randomUUID().replaceAll('-', '');

const page = (title, body) => new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Sebby Homes</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>body{background:#0B0B0B;color:#CFCFCF;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
.box{max-width:520px;border:1px solid #7A6330;padding:48px 44px;background:#121110;text-align:center}
h1{font-family:'Cormorant Garamond',serif;color:#fff;font-weight:600;font-size:2rem;margin:0 0 14px}
h1 em{font-style:normal;color:#C9A24B}p{font-size:.95rem;line-height:1.7;margin:0 0 10px}
.tag{letter-spacing:.3em;font-size:.65rem;color:#C9A24B;text-transform:uppercase;margin-bottom:22px}
a.btn{display:inline-block;margin-top:18px;background:#C9A24B;color:#0B0B0B;padding:13px 26px;text-decoration:none;font-family:Montserrat,sans-serif;font-weight:700;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase}</style>
</head><body><div class="box"><div class="tag">Sebby Homes · Dallas — Fort Worth</div>${body}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html;charset=utf-8' } });

async function sendEmail(env, to, subject, html, replyTo) {
  const payload = { from: env.FROM_EMAIL, to: [to], subject, html };
  if (replyTo) payload.reply_to = [replyTo];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
}

const emailShell = (inner) => `
<div style="background:#0B0B0B;padding:40px 20px;font-family:Arial,Helvetica,sans-serif">
 <div style="max-width:540px;margin:0 auto;border:1px solid #7A6330;background:#121110;padding:40px 36px">
  <div style="letter-spacing:4px;font-size:11px;color:#C9A24B;text-transform:uppercase;margin-bottom:24px">SEBBY HOMES &middot; DALLAS &mdash; FORT WORTH</div>
  ${inner}
  <hr style="border:0;border-top:1px solid #3a3324;margin:30px 0 16px">
  <div style="font-size:11px;color:#8F8A80;letter-spacing:2px;text-transform:uppercase">Building Excellence &middot; Creating Legacy</div>
 </div></div>`;

const btn = (href, label, color = '#C9A24B') =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#0B0B0B;padding:13px 26px;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:6px 8px 6px 0">${label}</a>`;

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      // ---------------- POST /request ----------------
      if (url.pathname === '/request' && req.method === 'POST') {
        const { name, email, property } = await req.json();
        if (!name || name.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || ''))
          return Response.json({ ok: false, error: 'invalid input' }, { status: 400, headers: CORS });

        // basic rate limit: one pending request per email per 10 min
        const rl = await env.GATE.get(`rl:${email.toLowerCase()}`);
        if (rl) return Response.json({ ok: false, error: 'too many requests' }, { status: 429, headers: CORS });
        await env.GATE.put(`rl:${email.toLowerCase()}`, '1', { expirationTtl: 600 });

        const id = tok(), vt = tok();
        await env.GATE.put(`req:${id}`, JSON.stringify({
          name: name.trim().slice(0, 80),
          email: email.trim().slice(0, 120),
          property: (property || 'All properties').slice(0, 80),
          status: 'pending_verify', vt, ts: Date.now(),
        }), { expirationTtl: 60 * 60 * 24 * 7 });

        // Path-style link (no "?id=" / "&t="): query-string "=" followed by hex
        // gets eaten by quoted-printable email decoders, which silently breaks
        // every token/key link. Path segments avoid "=" entirely.
        const link = `${url.origin}/verify/${id}/${vt}`;
        await sendEmail(env, email.trim(), 'Verify your email — Sebby Homes gallery access', emailShell(`
          <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">One quick step, ${esc(name.trim().split(' ')[0])}.</h2>
          <p style="color:#CFCFCF;font-size:14px;line-height:1.7">Confirm your email address to send your
          gallery access request for <strong style="color:#E5C76B">${esc(property || 'our portfolio')}</strong> to Sebby Homes for review.</p>
          ${btn(link, 'Verify my email')}
          <p style="color:#8F8A80;font-size:12px">If you didn't request this, you can ignore this email.</p>`));

        return Response.json({ ok: true }, { headers: CORS });
      }

      // ---------------- POST /contact ----------------
      if (url.pathname === '/contact' && req.method === 'POST') {
        const b = await req.json();
        const str = (v) => (typeof v === 'string' ? v : '').trim();
        const name = str(b.name);
        const email = str(b.email);
        // honeypot: real people never fill a field they cannot see
        if (b.website) return Response.json({ ok: true }, { headers: CORS });
        if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
          return Response.json({ ok: false, error: 'invalid input' }, { status: 400, headers: CORS });

        const rl = await env.GATE.get(`crl:${email.toLowerCase()}`);
        if (rl) return Response.json({ ok: false, error: 'too many requests' }, { status: 429, headers: CORS });
        await env.GATE.put(`crl:${email.toLowerCase()}`, '1', { expirationTtl: 600 });

        const f = {
          name: name.slice(0, 80),
          email: email.slice(0, 120),
          phone: str(b.phone).slice(0, 40),
          location: str(b.location).slice(0, 120),
          projectType: str(b.projectType).slice(0, 80),
          timeline: str(b.timeline).slice(0, 80),
          message: str(b.message).slice(0, 4000),
          ts: Date.now(),
        };
        await env.GATE.put(`msg:${tok()}`, JSON.stringify(f), { expirationTtl: 60 * 60 * 24 * 365 });

        const row = (k, v) => v ? `<strong style="color:#E5C76B">${k}:</strong> ${esc(v)}<br>` : '';
        await sendEmail(env, env.OWNER_EMAIL, `New inquiry — ${f.name}${f.location ? ' · ' + f.location : ''}`, emailShell(`
          <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">New inquiry from sebby.homes</h2>
          <p style="color:#CFCFCF;font-size:14px;line-height:1.8">
            ${row('Name', f.name)}
            <strong style="color:#E5C76B">Email:</strong> <a href="mailto:${esc(f.email)}" style="color:#C9A24B">${esc(f.email)}</a><br>
            ${f.phone ? `<strong style="color:#E5C76B">Phone:</strong> <a href="tel:${esc(f.phone)}" style="color:#C9A24B">${esc(f.phone)}</a><br>` : ''}
            ${row('Location', f.location)}
            ${row('Project', f.projectType)}
            ${row('Timeline', f.timeline)}
            <strong style="color:#E5C76B">When:</strong> ${new Date(f.ts).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</p>
          ${f.message ? `<div style="border-left:2px solid #7A6330;padding-left:16px;margin-top:8px;color:#CFCFCF;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(f.message)}</div>` : ''}
          ${btn(`mailto:${esc(f.email)}`, 'Reply')}`), f.email);

        await sendEmail(env, f.email, 'We received your message — Sebby Homes', emailShell(`
          <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">Thank you, ${esc(f.name.split(' ')[0])}.</h2>
          <p style="color:#CFCFCF;font-size:14px;line-height:1.7">Your message reached Seb directly. He reads every
          inquiry himself and will reply personally, usually within one business day.</p>
          <p style="color:#CFCFCF;font-size:14px;line-height:1.7">If it's time-sensitive, call
          <a href="tel:+14699963789" style="color:#C9A24B">469-996-3789</a>.</p>
          ${f.message ? `<div style="border-left:2px solid #7A6330;padding-left:16px;margin-top:18px;color:#8F8A80;font-size:13px;line-height:1.7;white-space:pre-wrap">${esc(f.message)}</div>` : ''}`));

        return Response.json({ ok: true }, { headers: CORS });
      }

      // ---------------- GET /verify ----------------
      if (url.pathname === '/verify' || url.pathname.startsWith('/verify/')) {
        const seg = url.pathname.split('/').filter(Boolean); // ['verify', id, t]
        const id = seg[1] || url.searchParams.get('id');
        const t  = seg[2] || url.searchParams.get('t');
        const raw = await env.GATE.get(`req:${id}`);
        if (!raw) return page('Link expired', `<h1>Link <em>expired.</em></h1><p>This verification link is no longer valid. Please submit a new request.</p><a class="btn" href="${SITE}/#proof">Back to sebby.homes</a>`);
        const r = JSON.parse(raw);
        if (r.vt !== t) return page('Invalid link', `<h1>Invalid <em>link.</em></h1><p>This verification link is not valid.</p>`);

        if (r.status === 'pending_verify') {
          r.status = 'pending_approval';
          r.at = tok(); // approval token for owner links
          await env.GATE.put(`req:${id}`, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 30 });

          const a = `${url.origin}/decide/${id}/${r.at}/approve`;
          const d = `${url.origin}/decide/${id}/${r.at}/deny`;
          await sendEmail(env, env.OWNER_EMAIL, `Gallery access request — ${r.name}`, emailShell(`
            <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">New gallery access request</h2>
            <p style="color:#CFCFCF;font-size:14px;line-height:1.8">
              <strong style="color:#E5C76B">Name:</strong> ${esc(r.name)}<br>
              <strong style="color:#E5C76B">Email:</strong> ${esc(r.email)} <span style="color:#56d364">(verified)</span><br>
              <strong style="color:#E5C76B">Property:</strong> ${esc(r.property)}<br>
              <strong style="color:#E5C76B">When:</strong> ${new Date(r.ts).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</p>
            ${btn(a, 'Approve access')} ${btn(d, 'Deny', '#8F8A80')}`));
        }
        return page('Email verified', `<h1>Email <em>verified.</em></h1><p>Your request has been sent to Sebby Homes for review.</p><p>You'll receive your private access link by email once it's approved.</p><a class="btn" href="${SITE}">Back to sebby.homes</a>`);
      }

      // ---------------- GET /decide (owner) ----------------
      if (url.pathname === '/decide' || url.pathname.startsWith('/decide/')) {
        const seg = url.pathname.split('/').filter(Boolean); // ['decide', id, t, action]
        const id = seg[1] || url.searchParams.get('id');
        const t  = seg[2] || url.searchParams.get('t');
        const action = seg[3] || url.searchParams.get('action');
        const raw = await env.GATE.get(`req:${id}`);
        if (!raw) return page('Not found', `<h1>Request <em>not found.</em></h1><p>This request has expired or was already handled.</p>`);
        const r = JSON.parse(raw);
        if (r.at !== t) return page('Invalid link', `<h1>Invalid <em>link.</em></h1><p>This decision link is not valid.</p>`);
        if (r.status === 'approved' || r.status === 'denied')
          return page('Already handled', `<h1>Already <em>${r.status}.</em></h1><p>${esc(r.name)} (${esc(r.email)}) — ${esc(r.property)}.</p>`);

        if (action === 'approve') {
          const key = tok();
          r.status = 'approved'; r.key = key;
          await env.GATE.put(`req:${id}`, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 365 });
          await env.GATE.put(`key:${key}`, JSON.stringify({ id, email: r.email, name: r.name }), { expirationTtl: 60 * 60 * 24 * 365 });
          await sendEmail(env, r.email, 'Your gallery access — Sebby Homes', emailShell(`
            <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">Access granted, ${esc(r.name.split(' ')[0])}.</h2>
            <p style="color:#CFCFCF;font-size:14px;line-height:1.7">Your request to view the full photo galleries has been approved. Use your private link below — it works on any of your devices.</p>
            ${btn(`${SITE}/#g/${key}`, 'View the galleries')}
            <p style="color:#8F8A80;font-size:12px">This link is personal to you — please don't forward it.</p>`));
          return page('Approved', `<h1>Access <em>approved.</em></h1><p>${esc(r.name)} (${esc(r.email)}) now has gallery access for ${esc(r.property)}.</p><p>They've been notified by email.</p>`);
        } else {
          r.status = 'denied';
          await env.GATE.put(`req:${id}`, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 30 });
          await sendEmail(env, r.email, 'Your gallery access request — Sebby Homes', emailShell(`
            <h2 style="color:#fff;font-weight:normal;margin:0 0 14px">About your request</h2>
            <p style="color:#CFCFCF;font-size:14px;line-height:1.7">Thank you for your interest in Sebby Homes. We're not able to grant gallery access at this time.</p>
            <p style="color:#CFCFCF;font-size:14px;line-height:1.7">If you're planning a custom build in Dallas&ndash;Fort Worth, we'd still love to talk: <a href="mailto:seb@sebby.homes" style="color:#C9A24B">seb@sebby.homes</a></p>`));
          return page('Denied', `<h1>Request <em>denied.</em></h1><p>${esc(r.name)} (${esc(r.email)}) has been notified.</p>`);
        }
      }

      // ---------------- GET /check ----------------
      if (url.pathname === '/check') {
        const key = url.searchParams.get('key') || '';
        const raw = await env.GATE.get(`key:${key}`);
        return Response.json({ ok: !!raw }, { headers: CORS });
      }

      return new Response('Not found', { status: 404, headers: CORS });
    } catch (e) {
      return Response.json({ ok: false, error: 'server error' }, { status: 500, headers: CORS });
    }
  },
};
