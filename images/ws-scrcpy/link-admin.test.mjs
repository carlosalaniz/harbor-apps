// node --test images/ws-scrcpy/link-admin.test.mjs (the image build runs it too): Android Link's admin page over a fake adb
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { adminPage, createAdmin, createLink, parseAddress, parseDevices, PhoneStore } from './link-admin.mjs';

// a phone at 192.168.1.20: pairing port 41231 code 123456, Wireless debugging port 37123, 5555 after tcpip
function fakePhone({ tcpip = true } = {}) {
  const st = { paired: false, listening: new Set([37123]), connected: new Map(), calls: [] };
  const adb = async (args) => {
    st.calls.push(args.join(' '));
    const [cmd, ...rest] = args;
    if (cmd === 'pair') {
      if (rest[0] === '192.168.1.20:41231' && rest[1] === '123456') {
        st.paired = true;
        return { ok: true, out: 'Successfully paired to 192.168.1.20:41231 [guid=adb-X]' };
      }
      return { ok: false, out: 'error: protocol fault (couldn\'t read status message): Success' };
    }
    if (cmd === 'connect') {
      const port = Number(rest[0].split(':')[1]);
      if (!rest[0].startsWith('192.168.1.20:') || !st.listening.has(port)) return { ok: true, out: `failed to connect to ${rest[0]}: Connection refused` };
      st.connected.set(rest[0], st.paired || port === 5555 ? 'device' : 'unauthorized');
      return { ok: true, out: `connected to ${rest[0]}` };
    }
    if (cmd === 'disconnect') {
      st.connected.delete(rest[0]);
      return { ok: true, out: `disconnected ${rest[0]}` };
    }
    if (cmd === 'devices') return { ok: true, out: `List of devices attached\n${[...st.connected].map(([s, state]) => `${s}\t${state} product:panther model:Pixel_7 device:panther transport_id:1`).join('\n')}\n` };
    if (cmd === '-s' && rest[1] === 'tcpip') {
      if (!tcpip) return { ok: false, out: 'error: closed' };
      st.listening.add(5555);
      st.connected.delete(rest[0]);
      return { ok: true, out: 'restarting in TCP mode port: 5555' };
    }
    if (cmd === '-s' && rest[1] === 'shell') return { ok: true, out: 'Pixel 7' };
    return { ok: false, out: `unexpected ${args.join(' ')}` };
  };
  return { adb, st };
}
const setup = (opts) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'link-'));
  const phone = fakePhone(opts);
  const store = new PhoneStore(dir);
  return { dir, store, phone, link: createLink(phone.adb, store, { sleep: async () => {} }) };
};
const PAIR = { pairAddress: '192.168.1.20:41231', code: '123456', address: '192.168.1.20:37123', name: '' };

test('addresses, codes and adb device lines', () => {
  assert.deepEqual(parseAddress('192.168.1.20:37123'), { host: '192.168.1.20', port: 37123 });
  assert.deepEqual(parseAddress(' Pixel-7.lan ', 5555), { host: 'pixel-7.lan', port: 5555 });
  for (const bad of ['192.168.1.20', '1.2.3.999:5555', '192.168.1.20:0', '192.168.1.20:70000', 'a b:1', '-x:1', 'host;rm:1', '']) assert.equal(parseAddress(bad), null, bad);
  const d = parseDevices('List of devices attached\n192.168.1.20:5555\tdevice product:panther model:Pixel_7 device:panther transport_id:3\nemulator-5554 offline\n\n');
  assert.deepEqual([...d], [['192.168.1.20:5555', { state: 'device', model: 'Pixel 7' }], ['emulator-5554', { state: 'offline', model: null }]]);
});

test('pairing: adb pair, connect, then the fixed port 5555; kept in phones.json', async () => {
  const { link, store, phone, dir } = setup();
  const r = await link.pair(PAIR);
  assert.equal(r.error, undefined);
  assert.deepEqual({ host: r.phone.host, port: r.phone.port, name: r.phone.name }, { host: '192.168.1.20', port: 5555, name: 'Pixel 7' });
  assert.ok(phone.st.calls.includes('pair 192.168.1.20:41231 123456'));
  assert.ok(phone.st.calls.includes('-s 192.168.1.20:37123 tcpip 5555'));
  assert.deepEqual([...phone.st.connected.keys()], ['192.168.1.20:5555']);
  assert.deepEqual(new PhoneStore(dir).phones, store.phones);
  assert.match(readFileSync(path.join(dir, 'phones.json'), 'utf8'), /"port": 5555/);
  // pairing the same phone again updates its entry
  await link.pair({ ...PAIR, name: 'Kitchen' });
  assert.equal(store.phones.length, 1);
  assert.equal(store.phones[0].name, 'Kitchen');
});

test('a phone that refuses tcpip keeps its Wireless debugging port', async () => {
  const { link } = setup({ tcpip: false });
  assert.equal((await link.pair(PAIR)).phone.port, 37123);
});

test('wrong input never reaches adb; a wrong code says what to do', async () => {
  const { link, phone } = setup();
  for (const f of [{ ...PAIR, code: '12345' }, { ...PAIR, pairAddress: 'x' }, { ...PAIR, address: '192.168.1.21:37123' }, { ...PAIR, address: '192.168.1.20' }]) assert.ok((await link.pair(f)).error);
  assert.deepEqual(phone.st.calls, []);
  const r = await link.pair({ ...PAIR, code: '654321' });
  assert.match(r.error, /did not accept the pairing.*new code/);
});

test('after a restart: not connected, then Reconnect with the new port', async () => {
  const { link, store, phone } = setup();
  const { phone: p } = await link.pair(PAIR);
  // the phone restarts: tcpip mode is gone, Wireless debugging comes back on another port
  phone.st.connected.clear();
  phone.st.listening = new Set([40001]);
  await link.keepConnected();
  assert.equal((await link.devices()).size, 0);
  assert.match((await link.reconnect(p.id, '39999')).error, /did not connect/);
  const r = await link.reconnect(p.id, '40001');
  assert.equal(r.error, undefined);
  assert.equal(store.get(p.id).port, 5555);
  assert.equal((await link.devices()).get('192.168.1.20:5555').state, 'device');
});

test('add by address (port 5555 by default), rename, remove', async () => {
  const { link, store, phone } = setup();
  phone.st.listening.add(5555);
  const r = await link.add({ address: '192.168.1.20', name: '' });
  assert.equal(r.phone.port, 5555);
  assert.match((await link.add({ address: '192.168.1.99' })).error, /Could not reach/);
  assert.equal(link.rename(r.phone.id, '  Living room ').phone.name, 'Living room');
  assert.ok(link.rename(r.phone.id, ' ').error);
  await link.remove(r.phone.id);
  assert.equal(store.phones.length, 0);
  assert.ok(phone.st.calls.includes('disconnect 192.168.1.20:5555'));
});

test('the page escapes names and shows each state in words', () => {
  const html = adminPage({ phones: [{ id: 'aaaaaaaa', host: '192.168.1.20', port: 5555, name: '<b>x</b>' }, { id: 'bbbbbbbb', host: '192.168.1.21', port: 5555, name: 'B' }], devices: parseDevices('192.168.1.20:5555\tunauthorized\n') });
  assert.ok(!html.includes('<b>x</b>'));
  assert.match(html, /Waiting: tap Allow on the phone/);
  assert.match(html, /Not connected/);
  assert.match(adminPage({ phones: [], devices: new Map() }), /No phone yet/);
});

test('the server: forms act, a form from another site does not', async () => {
  const { link, store } = setup();
  const server = createAdmin(link, store).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (p, body, headers = {}) => fetch(base + p, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(body) });
  try {
    assert.equal((await post('/pair', PAIR, { origin: 'http://evil.example' })).status, 403);
    assert.equal(store.phones.length, 0);
    const ok = await post('/pair', PAIR);
    assert.equal(ok.status, 303);
    assert.match(ok.headers.get('location'), /^\/\?done=paired&phone=[0-9a-f]{8}$/);
    const home = await (await fetch(base + ok.headers.get('location'))).text();
    assert.match(home, /Pixel 7 is paired/);
    assert.match(home, /Connected/);
    const bad = await post('/pair', { ...PAIR, code: 'x' });
    assert.equal(bad.status, 422);
    assert.match(await bad.text(), /six digits/);
    assert.equal((await post(`/phones/${store.phones[0].id}/remove`, {})).status, 303);
    assert.equal(store.phones.length, 0);
    assert.equal((await fetch(base + '/nope')).status, 404);
  } finally {
    server.close();
  }
});
