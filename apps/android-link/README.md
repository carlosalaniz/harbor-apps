# Android Link

Android Link shows your Android phones in the browser. The phones stay at home on this machine's network; Harbor
shares Android Link wherever you share the app: your network, your tailnet, or the internet. Nothing gets installed
on the phone: it uses Android's own Wireless debugging.

- **Phones**: phones on the network show up by themselves; pair one with its code. Android Link keeps them connected,
  and finds a phone again on its new port after it restarts.
- **Screen**: see a phone's screen and use it: tap, scroll, type. It can act as a real (hardware) keyboard and mouse:
  use your own keyboard and mouse, an on-screen keyboard, or a touchpad. Apps that ignore injected input (WhatsApp's
  code screens) accept these.
- **Shell**: a command line on each phone, with history.
- **Automation**: scripts that drive a phone, written in TypeScript and run safely on the server (no browser needed
  while they run). The first one, *Link WhatsApp with a code*, links WhatsApp Web or the desktop app to the phone's
  WhatsApp with the code the computer shows.
- **For programs and AI agents**: everything the page does is an API call. Settings links to the API documentation
  (Swagger) and to `/api/discovery`, which tells an agent what it can do.

Harbor shows Android Link's password once after install. Later, the app's drawer shows it again (Login → Show
password…) and can change it.

## Pair a phone (Android 11 or newer)

1. On the phone: **Settings → About phone**, tap **Build number** seven times. This turns on Developer options.
2. **Settings → System → Developer options → Wireless debugging**: turn it on. The phone must be on the same
   network as this machine.
3. Tap **Pair device with pairing code** and keep that dialog open.
4. Open Android Link: the phone appears under **Add a phone** with its pairing port filled in. Type the six-digit
   code from the dialog and press **Pair**.

If the phone does not show up, set **Home network range** in the app's settings (for example `192.168.1.0/24`), or
use *Can't see your phone? Enter its address yourself*.

## Good to know

- **Whoever has the password controls the phones**, including a shell on each and scripts that drive them. Keep it
  to yourself.
- To make a phone stop trusting Android Link: on the phone, **Developer options → Revoke USB debugging
  authorizations**. Removing it in Android Link only stops Android Link from connecting.
- A phone locked with a PIN or a fingerprint cannot be unlocked by an automation: it stops and says so.
- There is no phone audio yet.
- Banking apps may refuse to run while Developer options are on. That is the phone's choice; Android Link cannot
  change it.
- Android Link keeps its phones, scripts and the key the phones trust on its data volume: if you remove the app with
  its data, pair the phones again.
