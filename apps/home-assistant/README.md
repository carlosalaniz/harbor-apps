# Home Assistant

Open-source home automation: one dashboard for your lights, plugs, sensors, heating, cameras and media players
from hundreds of brands, with automations that run on this machine instead of someone's cloud.

Home Assistant talks to devices over your network (Philips Hue, Shelly, ESPHome, Tasmota, MQTT, Sonos, Chromecast,
many Wi-Fi brands) and to cloud services where a device has no local option. The companion app for iPhone and
Android gives you the dashboard, notifications and your phone's sensors (location, battery) as entities.

- Website: https://www.home-assistant.io
- Source code: https://github.com/home-assistant/core
- Help: https://www.home-assistant.io/docs/ and https://community.home-assistant.io

## What Harbor does

- Runs Home Assistant (the official Container image) on 127.0.0.1 with everything in one retained volume.
- Lets Home Assistant accept the addresses Harbor's proxies hand it (the secure LAN address, Tailscale, your domains
  and your own proxy). Home Assistant refuses forwarded requests with "400: Bad Request" unless it trusts the proxy,
  so after every start Harbor adds its proxy addresses to Home Assistant's trusted proxies (its HTTP settings in
  `.storage/http`) and turns on forwarded headers. Addresses you add yourself are kept. When Harbor's list changes
  (the first start, or after you add your own proxy), Home Assistant restarts once by itself.
- Keeps Harbor's app login off for this app: Home Assistant has its own login with two-factor, and the companion
  apps call the same address with their own tokens.

## Storage

- `config`: Home Assistant's whole `/config` folder: `configuration.yaml`, the history database
  (`home-assistant_v2.db`), automations, dashboards, Home Assistant's own backups (`backups/`) and logs.
  Retained on remove; Harbor never deletes it.

## First run

1. Open Home Assistant right away and create the owner account. Whoever finishes the onboarding first owns
   the house, so do not leave it waiting on a shared network.
2. Set your home's location, time zone and units; they drive sunrise automations, weather and the energy view.
3. Under Settings → System → Network, set the Home Assistant URL to this app's main address (and the local one,
   if they differ). Notifications, the companion app and shared camera links use it.
4. Add devices under Settings → Devices & services → Add integration and type the device's IP address when asked.
5. Install the companion app on your phone and sign in with the same address.

## Limits on Harbor

Harbor runs the Container installation, on its own network, without host networking, USB or Bluetooth access.

- **No add-ons.** Add-ons need Home Assistant OS or Supervised. Run what they provide as separate apps or devices:
  an MQTT broker, Zigbee2MQTT or Z-Wave JS on another machine, ESPHome's dashboard elsewhere.
- **No automatic discovery.** mDNS/zeroconf, SSDP/UPnP, DHCP and broadcast traffic do not reach this app, so the
  "Discovered" list stays empty and broadcast-based features (Wake-on-LAN, some speaker groups) do not
  work. Add each integration by hand with the device's IP address; give your devices fixed
  addresses in your router.
- **No USB sticks, serial ports or Bluetooth adapters.** Zigbee, Z-Wave and Thread dongles cannot be passed in.
  Use a network coordinator instead (an Ethernet or Wi-Fi Zigbee coordinator such as the SLZB-06, or ser2net on a
  Raspberry Pi), and ESPHome Bluetooth proxies for Bluetooth devices.
- **No Matter**: it needs the Matter Server add-on and host networking with IPv6.
- **Only the web port is published.** Integrations that wait for devices or other hubs to connect back on another
  port (HomeKit Bridge, the emulated Hue bridge, some UDP push protocols) do not receive those connections. Prefer
  integrations that poll or keep their own connection open, or go through MQTT.
- Harbor keeps "use forwarded headers" on and its own proxy addresses in the trusted list on every start; switching
  them off in Home Assistant's network settings lasts only until the next start. A YAML `http:` section in
  `configuration.yaml` is only imported once, as a trial you confirm in Home Assistant's settings.
- Assist's microphone in the browser and a few cards need a secure address (secure LAN, Tailscale or a domain);
  plain http works for everything else.
- Home Assistant Cloud (Nabu Casa, paid) works as an alternative remote access; it is optional.

Upstream: https://www.home-assistant.io
