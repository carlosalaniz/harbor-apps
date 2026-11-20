# IP Lookup

Adds **Ask online** to Harbor's Settings → Allowed addresses: for an address that tried to reach the apps you
publish on the internet, it asks

- **ipinfo**: city, region, country, the network that runs the address, its hostname, and whether it is a hosting
  provider, a VPN, a proxy, a Tor exit or a relay (works without a token, with a lower daily limit);
- **AbuseIPDB**: an abuse score from 0 to 100, how many reports others filed and when the last one was, and what the
  address is used for (needs a free API key).

Harbor shows both answers together. Answers are kept for 24 hours; nothing is written to disk.

## Your VPN first

IP Lookup only goes on the internet through the VPN in **Settings → VPN**, so ipinfo and AbuseIPDB see your VPN's
address, never your home's. Harbor will not install it until a VPN is set up, and never offers *Direct* for it. The
services do see the address you ask about: that is the question.

## Keys

At install (or later on the app page, *Values you provided*):

- **AbuseIPDB API key**: make a free account at abuseipdb.com → Account → API → Create Key. Without it, AbuseIPDB is
  skipped.
- **ipinfo access token** (optional): a free account at ipinfo.io gives a higher daily limit.

The app's settings (*Ask ipinfo*, *Ask AbuseIPDB*) turn each service on or off.

## Its own page

Opening the app shows which services are on and a box to look an address up by hand. Harbor itself asks it on this
machine only (`GET /v1/lookup?ip=…`), never through the internet.

Source: [carlosalaniz/harbor `images/ip-lookup`](https://github.com/carlosalaniz/harbor/tree/main/images/ip-lookup).
