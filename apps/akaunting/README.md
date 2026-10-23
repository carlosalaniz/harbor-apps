# Akaunting

Online Accounting Software

- Website: https://akaunting.com/
- Source code: https://github.com/akaunting/akaunting
- Help: https://github.com/akaunting/akaunting/issues

Harbor creates the `umbrel@umbrel.local` login at install and shows its password once.

## Security (2026-10-23)

Akaunting's image runs PHP 8.1, which no longer receives security fixes, so this app is **not patched against PHP2Shell** (CVE-2026-109618/109619, remote code execution with no login needed). Keep it on your home network or Tailscale, and do not give it a public address. Harbor will update it once Akaunting publishes an image on PHP 8.2 or newer.
