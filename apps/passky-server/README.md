# Passky Server

Server for Passky (password manager)

- Website: https://passky.org
- Source code: https://github.com/Rabbit-Company/Passky-Server
- Help: https://passky.org/contact

Harbor creates the `admin` login at install and shows its password once.

## Security (2026-10-23)

Passky Server 8.1.8 runs PHP 8.2.15, which is **not patched against PHP2Shell** (CVE-2026-109618/109619, remote code execution with no login needed). The fix upstream is Passky Server 9, a rewrite that Harbor has not tested yet (how its data moves over is unknown). Until then, keep it on your home network or Tailscale and do not give it a public address.
