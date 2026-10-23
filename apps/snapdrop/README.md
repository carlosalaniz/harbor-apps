# Snapdrop

The easiest way to share files between devices

- Website: https://snapdrop.net/
- Source code: https://github.com/RobinLinus/snapdrop
- Help: https://github.com/RobinLinus/snapdrop/blob/master/docs/faq.md

## Security (2026-10-23)

The Snapdrop image (linuxserver/snapdrop) is deprecated and gets no new builds, so its PHP is **not patched against PHP2Shell** (CVE-2026-109618/109619, remote code execution with no login needed) and never will be. Keep it on your home network or Tailscale, and do not give it a public address.
