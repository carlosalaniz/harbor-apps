// Android Link's admin page (apps/android-link): pair Android phones on the local network over Wireless debugging and
// keep them connected, so ws-scrcpy (same container, same adb server) lists them and shows their screens.
// No dependencies; it runs only when LINK_ADMIN_PORT is set (entrypoint.sh).
//   LINK_ADMIN_PORT  port of this page (Android Link: 8001, its own endpoint behind Harbor's login)
//   LINK_DATA        folder kept across restarts: phones.json here; entrypoint.sh points HOME here, so adb's key
//                    (the one the phones trust after pairing) is kept too
// Pairing (Android 11+): Wireless debugging -> "Pair device with pairing code" gives an address and a code; adb pair,
// then adb connect to the address on the Wireless debugging screen. Android picks a new port for that every time
// Wireless debugging turns on, so once connected the page also asks the phone to listen on 5555 (adb tcpip), which
// lasts until the phone restarts; after a restart the admin types the new port once (pairing is kept).
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXED_PORT = 5555;
const HOST_RE = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)*)$/i;

// "192.168.1.20:37123" -> { host, port }; a bare host gets `defaultPort` (null: a port is required)
export function parseAddress(text, defaultPort = null) {
  const s = String(text ?? '').trim();
  const m = /^([^:\s]+)(?::(\d{1,5}))?$/.exec(s);
  if (!m || !HOST_RE.test(m[1])) return null;
  if (/^\d+(\.\d+){3}$/.test(m[1]) && m[1].split('.').some((o) => Number(o) > 255)) return null;
  const port = m[2] === undefined ? defaultPort : Number(m[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host: m[1].toLowerCase(), port };
}

export const validCode = (code) => /^\d{6}$/.test(String(code ?? '').trim());

// `adb devices -l` -> Map serial -> { state, model }
export function parseDevices(out) {
  const devices = new Map();
  for (const line of String(out).split('\n')) {
    const m = /^(\S+)\s+(device|offline|unauthorized|authorizing|connecting|no permissions)\b(.*)$/.exec(line.trim());
    if (!m) continue;
    const model = /\bmodel:(\S+)/.exec(m[3])?.[1]?.replace(/_/g, ' ') ?? null;
    devices.set(m[1], { state: m[2], model });
  }
  return devices;
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const serialOf = (p) => `${p.host}:${p.port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- phones.json

export class PhoneStore {
  constructor(dir) {
    this.file = path.join(dir, 'phones.json');
    mkdirSync(dir, { recursive: true });
    try {
      const doc = JSON.parse(readFileSync(this.file, 'utf8'));
      this.phones = Array.isArray(doc.phones) ? doc.phones.filter((p) => p && typeof p.id === 'string' && parseAddress(`${p.host}:${p.port}`)) : [];
    } catch {
      this.phones = [];
    }
  }
  save() {
    writeFileSync(`${this.file}.tmp`, JSON.stringify({ phones: this.phones }, null, 2) + '\n', { mode: 0o600 });
    renameSync(`${this.file}.tmp`, this.file);
  }
  get(id) {
    return this.phones.find((p) => p.id === id);
  }
  byHost(host) {
    return this.phones.find((p) => p.host === host);
  }
  // one entry per phone (its address on the network); pairing it again updates that entry
  upsert({ host, port, name }) {
    let p = this.byHost(host);
    if (p) Object.assign(p, { port, ...(name ? { name } : {}) });
    else this.phones.push((p = { id: randomBytes(4).toString('hex'), host, port, name: name || host }));
    this.save();
    return p;
  }
  remove(id) {
    this.phones = this.phones.filter((p) => p.id !== id);
    this.save();
  }
}

// ---- adb

export function adbRunner(bin = 'adb') {
  return (args, timeout = 20_000) =>
    new Promise((resolve) => {
      execFile(bin, args, { timeout, maxBuffer: 1 << 20 }, (err, stdout, stderr) => {
        const out = `${stdout ?? ''}${stderr ?? ''}`.trim();
        resolve({ ok: !err, out });
      });
    });
}

// Everything the page does to phones, over an adb runner (a fake one in the tests)
export function createLink(adb, store, opts = {}) {
  const wait = opts.sleep ?? sleep;
  let busy = 0;
  const devices = async () => parseDevices((await adb(['devices', '-l'], 10_000)).out);
  const stateOf = async (serial) => (await devices()).get(serial)?.state ?? null;
  const waitFor = async (serial, seconds) => {
    for (let i = 0; i < seconds; i++) {
      const s = await stateOf(serial);
      if (s === 'device' || s === 'unauthorized') return s;
      await wait(1000);
    }
    return stateOf(serial);
  };
  const connect = async (serial) => {
    const r = await adb(['connect', serial], 10_000);
    return r.ok && /connected to/i.test(r.out) && !/failed|unable|cannot/i.test(r.out) ? null : (r.out.split('\n')[0] || 'no answer');
  };
  const modelOf = async (serial) => {
    const r = await adb(['-s', serial, 'shell', 'getprop', 'ro.product.model'], 10_000);
    return r.ok ? r.out.split('\n')[0].trim().slice(0, 60) : '';
  };
  // ask the phone to listen on 5555 too (until it restarts); the port Android picked stops mattering
  const pinPort = async (host, port) => {
    if (port === FIXED_PORT) return port;
    const serial = `${host}:${port}`;
    const r = await adb(['-s', serial, 'tcpip', String(FIXED_PORT)], 15_000);
    if (!r.ok || !/restarting|already/i.test(r.out)) return port;
    await adb(['disconnect', serial], 5_000);
    await wait(2000);
    const fixed = `${host}:${FIXED_PORT}`;
    for (let i = 0; i < 3; i++) {
      if (!(await connect(fixed)) && (await waitFor(fixed, 8)) === 'device') return FIXED_PORT;
      await wait(1000);
    }
    await connect(serial); // the Wireless debugging port again
    return port;
  };
  const guard = async (fn) => {
    busy++;
    try {
      return await fn();
    } finally {
      busy--;
    }
  };

  return {
    devices,
    get busy() {
      return busy > 0;
    },

    async pair({ pairAddress, code, address, name }) {
      const pa = parseAddress(pairAddress);
      const ca = parseAddress(address);
      if (!pa) return { error: 'The pairing address is the IP address and port under "Pair with device", like 192.168.1.20:41231.' };
      if (!validCode(code)) return { error: 'The pairing code has six digits.' };
      if (!ca) return { error: 'The phone address is the "IP address & Port" on the Wireless debugging screen, like 192.168.1.20:37123.' };
      if (ca.host !== pa.host) return { error: 'The pairing address and the phone address should be the same phone (the same IP address).' };
      return guard(async () => {
        const paired = await adb(['pair', `${pa.host}:${pa.port}`, String(code).trim()], 30_000);
        if (!paired.ok || !/successfully paired/i.test(paired.out)) return { error: `The phone did not accept the pairing: ${paired.out.split('\n').pop() || 'no answer'}. Open "Pair device with pairing code" again and use the new code.` };
        const serial = `${ca.host}:${ca.port}`;
        const failed = await connect(serial);
        if (failed || (await waitFor(serial, 10)) !== 'device') return { error: `Paired, but the phone did not connect at ${serial} (${failed ?? 'not ready'}). Check the port on the Wireless debugging screen, then use Reconnect.` , phone: store.upsert({ host: ca.host, port: ca.port, name: String(name ?? '').trim().slice(0, 60) }) };
        const model = await modelOf(serial);
        const port = await pinPort(ca.host, ca.port);
        return { phone: store.upsert({ host: ca.host, port, name: String(name ?? '').trim().slice(0, 60) || model }) };
      });
    },

    // a phone that already listens on a fixed port (adb tcpip 5555 from a computer, or an Android emulator)
    async add({ address, name }) {
      const a = parseAddress(address, FIXED_PORT);
      if (!a) return { error: 'Type the phone address, like 192.168.1.20 or 192.168.1.20:5555.' };
      return guard(async () => {
        const serial = `${a.host}:${a.port}`;
        const failed = await connect(serial);
        if (failed) return { error: `Could not reach ${serial}: ${failed}.` };
        const state = await waitFor(serial, 10);
        const model = state === 'device' ? await modelOf(serial) : '';
        return { phone: store.upsert({ host: a.host, port: a.port, name: String(name ?? '').trim().slice(0, 60) || model }), state };
      });
    },

    // after the phone restarted: the port Wireless debugging shows now (or none: try the stored one again)
    async reconnect(id, portText) {
      const p = store.get(id);
      if (!p) return { error: 'That phone is not in the list any more.' };
      const port = String(portText ?? '').trim() === '' ? p.port : Number(portText);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: 'The port is the number after the colon on the Wireless debugging screen.' };
      return guard(async () => {
        const serial = `${p.host}:${port}`;
        await adb(['disconnect', serialOf(p)], 5_000);
        const failed = await connect(serial);
        if (failed || (await waitFor(serial, 10)) !== 'device') return { error: `${p.name} did not connect at ${serial} (${failed ?? 'not ready'}). Turn on Wireless debugging on the phone and type the port it shows.` };
        return { phone: store.upsert({ host: p.host, port: await pinPort(p.host, port) }) };
      });
    },

    rename(id, name) {
      const p = store.get(id);
      const n = String(name ?? '').trim().slice(0, 60);
      if (!p) return { error: 'That phone is not in the list any more.' };
      if (!n) return { error: 'Type a name.' };
      p.name = n;
      store.save();
      return { phone: p };
    },

    async remove(id) {
      const p = store.get(id);
      if (!p) return {};
      await adb(['disconnect', serialOf(p)], 5_000);
      store.remove(id);
      return { phone: p };
    },

    // every 15 s: reconnect what dropped (a phone that left the Wi-Fi or slept)
    async keepConnected() {
      if (busy) return;
      const now = await devices();
      for (const p of store.phones) {
        const s = now.get(serialOf(p))?.state;
        if (s === 'device' || s === 'unauthorized' || s === 'authorizing') continue;
        if (s === 'offline') await adb(['disconnect', serialOf(p)], 5_000);
        await connect(serialOf(p));
      }
    },
  };
}

// ---- the page

const STATE = {
  device: ['ok', 'Connected'],
  unauthorized: ['wait', 'Waiting: tap Allow on the phone'],
  authorizing: ['wait', 'Waiting: tap Allow on the phone'],
};
const DONE = {
  paired: (n) => `${n} is paired. Its screen is on Android Link's main page.`,
  added: (n) => `${n} is added.`,
  reconnected: (n) => `${n} is connected again.`,
  renamed: (n) => `Renamed to ${n}.`,
  removed: (n) => `${n} is removed. To stop it trusting Android Link, on the phone: Developer options → Revoke USB debugging authorizations.`,
};

export function adminPage({ phones, devices, notice = null, error = null, form = {} }) {
  const rows = phones
    .map((p) => {
      const d = devices.get(serialOf(p));
      const [cls, label] = STATE[d?.state] ?? ['off', 'Not connected'];
      return `<li class="phone">
<div class="head"><div><strong>${esc(p.name)}</strong><span class="muted">${esc(serialOf(p))}${d?.model && d.model !== p.name ? ` · ${esc(d.model)}` : ''}</span></div><span class="pill ${cls}">${esc(label)}</span></div>
${cls === 'off' ? `<p class="muted">Restarted or left the Wi-Fi? On the phone, turn on Wireless debugging and type the port it shows (the number after the colon).</p>` : ''}
<div class="actions">
<form method="post" action="/phones/${esc(p.id)}/reconnect" class="inline"><label class="sr" for="port-${esc(p.id)}">New port for ${esc(p.name)}</label><input id="port-${esc(p.id)}" name="port" inputmode="numeric" placeholder="port" size="6"><button type="submit" class="quiet">Reconnect</button></form>
<details><summary>Rename</summary><form method="post" action="/phones/${esc(p.id)}/rename" class="inline"><label class="sr" for="name-${esc(p.id)}">New name for ${esc(p.name)}</label><input id="name-${esc(p.id)}" name="name" value="${esc(p.name)}" maxlength="60" required><button type="submit" class="quiet">Save</button></form></details>
<details><summary>Remove</summary><form method="post" action="/phones/${esc(p.id)}/remove" class="inline"><span class="muted">Remove ${esc(p.name)} from Android Link?</span><button type="submit" class="danger">Remove</button></form></details>
</div>
</li>`;
    })
    .join('\n');
  const v = (k) => esc(form[k] ?? '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Android Link admin</title>
<style>
:root { --bg: #f4f6f9; --card: #ffffff; --fg: #111823; --muted: #5b6878; --line: rgba(17, 24, 35, 0.12); --accent: #1f6feb; --accent-fg: #fff; --bad: #c62828; --ok: #1a7f37; --wait: #9a6700; --focus: #9a6700; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #0d1219; --card: #181f29; --fg: #eef2f7; --muted: #9aa8ba; --line: rgba(255, 255, 255, 0.12); --accent: #3d9cff; --bad: #ff6b6b; --ok: #4ac26b; --wait: #ffd166; --focus: #ffd166; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 640px; margin: 0 auto; padding: 40px 16px 48px; }
.mark { width: 40px; height: 40px; margin-bottom: 24px; }
h1 { font-size: 26px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
h2 { font-size: 17px; font-weight: 600; margin: 32px 0 16px; }
p { margin: 0 0 16px; }
.muted { color: var(--muted); }
.lead { color: var(--muted); margin-bottom: 24px; }
.card, .phone { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px; }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.head div { display: grid; min-width: 0; }
.head span.muted { font-size: 13px; overflow-wrap: anywhere; }
.phone > p { margin: 16px 0 0; font-size: 14px; }
.pill { flex: none; font-size: 13px; font-weight: 600; padding: 2px 10px; border-radius: 999px; border: 1px solid currentColor; }
.pill.ok { color: var(--ok); } .pill.wait { color: var(--wait); } .pill.off { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin-top: 16px; }
.inline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
details > summary { cursor: pointer; color: var(--accent); font-weight: 500; list-style: none; padding: 6px 0; }
details > summary::-webkit-details-marker { display: none; }
details[open] { flex-basis: 100%; }
details[open] > summary { margin-bottom: 8px; }
form.card { display: grid; gap: 16px; }
label { display: grid; gap: 8px; font-weight: 500; }
label small { font-weight: 400; color: var(--muted); }
input { font: inherit; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: transparent; color: var(--fg); width: 100%; }
.inline input { width: auto; min-width: 0; flex: 1 1 96px; }
button { font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 10px; border: 0; background: var(--accent); color: var(--accent-fg); cursor: pointer; justify-self: start; }
button.quiet { background: transparent; color: var(--accent); border: 1px solid var(--line); }
button.danger { background: var(--bad); color: #fff; }
input:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
ol { margin: 0; padding-left: 20px; color: var(--muted); }
ol li { margin-bottom: 4px; }
.notice, .error { border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid currentColor; }
.notice { color: var(--ok); } .error { color: var(--bad); }
.empty { color: var(--muted); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
footer { margin-top: 40px; font-size: 13px; color: var(--muted); }
</style>
</head>
<body>
<main>
<svg class="mark" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v3M10 13.5v3M3.5 10h3M13.5 10h3"/><circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none"/></svg>
<h1>android link</h1>
<p class="lead">Phones on this network. Their screens open from Android Link's main page, wherever Harbor shares it.</p>
${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ''}${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
<h2>phones</h2>
${rows ? `<ul>${rows}</ul>` : '<p class="empty">No phone yet. Pair one below.</p>'}
<h2>pair a phone</h2>
<form method="post" action="/pair" class="card">
<ol>
<li>On the phone: Settings → About phone → tap Build number seven times (turns on Developer options).</li>
<li>Settings → System → Developer options → Wireless debugging: turn it on (the phone must be on this machine's network).</li>
<li>Tap "Pair device with pairing code" and keep that dialog open.</li>
</ol>
<label>Pairing address <small>IP address &amp; port in the pairing dialog</small><input name="pairAddress" value="${v('pairAddress')}" placeholder="192.168.1.20:41231" autocomplete="off" required></label>
<label>Pairing code <small>six digits in the pairing dialog</small><input name="code" value="" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label>
<label>Phone address <small>"IP address &amp; Port" on the Wireless debugging screen (behind the dialog)</small><input name="address" value="${v('address')}" placeholder="192.168.1.20:37123" autocomplete="off" required></label>
<label>Name <small>optional; the phone's model otherwise</small><input name="name" value="${v('name')}" maxlength="60" autocomplete="off"></label>
<button type="submit">Pair</button>
</form>
<details class="card" style="margin-top:16px">
<summary>Add a phone by address</summary>
<form method="post" action="/add" class="card" style="border:0;padding:0">
<p class="muted">For a phone already listening on a fixed port (adb tcpip 5555 from a computer) or an Android emulator. The phone asks to allow this computer the first time.</p>
<label>Address<input name="address" placeholder="192.168.1.20:5555" autocomplete="off" required></label>
<label>Name <small>optional</small><input name="name" maxlength="60" autocomplete="off"></label>
<button type="submit">Add</button>
</form>
</details>
<footer>Anyone with Android Link's main password controls these phones, shell included: keep it to yourself. This page has its own password, in the app's drawer in Harbor (Login).</footer>
</main>
</body>
</html>
`;
}

// ---- the server

export function createAdmin(link, store) {
  const readForm = (req) =>
    new Promise((resolve) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (c) => {
        body += c;
        if (body.length > 8192) req.destroy();
      });
      req.on('end', () => resolve(new URLSearchParams(body)));
      req.on('error', () => resolve(new URLSearchParams()));
    });
  const page = async (res, status, extra = {}) => {
    const html = adminPage({ phones: store.phones, devices: await link.devices(), ...extra });
    res.writeHead(status, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    });
    res.end(html);
  };
  const done = (res, what, phone) => {
    res.writeHead(303, { location: `/?done=${what}${phone ? `&phone=${encodeURIComponent(phone.id)}` : ''}`, 'cache-control': 'no-store' });
    res.end();
  };

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://admin');
      if (req.method === 'GET' && url.pathname === '/') {
        const what = url.searchParams.get('done');
        const phone = store.get(url.searchParams.get('phone') ?? '') ?? null;
        const notice = DONE[what] ? DONE[what](what === 'removed' ? 'The phone' : (phone?.name ?? 'The phone')) : null;
        return await page(res, 200, { notice });
      }
      if (req.method !== 'POST') {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('Not here.\n');
      }
      // a form from another site never acts here (Harbor's login cookie is SameSite=Lax as well)
      const origin = req.headers['origin'];
      if (origin && origin !== 'null' && new URL(origin).host !== req.headers['host']) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('This form only works from Android Link\'s own page.\n');
      }
      const form = await readForm(req);
      const f = Object.fromEntries(form);
      let m;
      if (url.pathname === '/pair') {
        const r = await link.pair(f);
        return r.error ? await page(res, 422, { error: r.error, form: { ...f, code: '' } }) : done(res, 'paired', r.phone);
      }
      if (url.pathname === '/add') {
        const r = await link.add(f);
        return r.error ? await page(res, 422, { error: r.error }) : done(res, 'added', r.phone);
      }
      if ((m = /^\/phones\/([0-9a-f]{8})\/(reconnect|rename|remove)$/.exec(url.pathname))) {
        const r = m[2] === 'reconnect' ? await link.reconnect(m[1], f.port) : m[2] === 'rename' ? link.rename(m[1], f.name) : await link.remove(m[1]);
        return r.error ? await page(res, 422, { error: r.error }) : done(res, m[2] === 'reconnect' ? 'reconnected' : m[2] === 'rename' ? 'renamed' : 'removed', r.phone);
      }
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not here.\n');
    } catch (e) {
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Something went wrong: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.LINK_ADMIN_PORT || 8001);
  const store = new PhoneStore(process.env.LINK_DATA || '/data');
  const link = createLink(adbRunner(), store);
  const tick = () => link.keepConnected().catch(() => {}).finally(() => setTimeout(tick, 15_000));
  tick();
  createAdmin(link, store).listen(port, () => console.log(`android link admin on :${port}, ${store.phones.length} phone(s)`));
}
