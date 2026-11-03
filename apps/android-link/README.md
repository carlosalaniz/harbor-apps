# Android Link

Android Link shows your Android phones in the browser. The phones stay at home on this machine's network; Harbor
shares the screens wherever you share the app: your network, your tailnet, or the internet. You can see the screen,
tap and swipe, type, copy and paste, and drop an APK file to install it. Nothing gets installed on the phone: it
uses Android's own Wireless debugging. The screen viewer is [ws-scrcpy](https://github.com/NetrisTV/ws-scrcpy).

Android Link has two addresses, each with its own Harbor password:

- **Android Link** (the main address): the phones and their screens. Share this one.
- **admin**: pair, rename, reconnect and remove phones. It can stay on this machine or your network.

Harbor shows both passwords once after install. Later, the app's drawer shows them again (Login → Show password…)
and can change them.

## Pair a phone (Android 11 or newer)

1. On the phone: **Settings → About phone**, tap **Build number** seven times. This turns on Developer options.
2. **Settings → System → Developer options → Wireless debugging**: turn it on. The phone must be on the same
   network as this machine.
3. Tap **Pair device with pairing code**. Keep that dialog open.
4. Open Android Link's **admin** address and fill in the form:
   - *Pairing address*: the IP address and port in the dialog.
   - *Pairing code*: the six digits in the dialog.
   - *Phone address*: the "IP address & Port" on the Wireless debugging screen, behind the dialog.
5. Press **Pair**. The phone shows up as *Connected*. Open Android Link's main address and pick it.

After pairing, Android Link asks the phone to keep listening on port 5555, so it reconnects on its own when the
phone sleeps or leaves the Wi-Fi for a while.

**After the phone restarts**, port 5555 is gone and Android picks a new port. Turn on Wireless debugging again,
then in the admin page type the port it shows (the number after the colon) and press **Reconnect**. You do not need
to pair again.

A phone already listening on a fixed port (`adb tcpip 5555` from a computer) can be added by address instead; the
phone asks you to allow it the first time.

## Good to know

- **Whoever has the main password controls the phones**, including a shell on each. Keep it to yourself.
- To make a phone stop trusting Android Link: on the phone, **Developer options → Revoke USB debugging
  authorizations**. Removing it in the admin page only stops Android Link from connecting.
- There is no phone audio: the viewer carries the screen only.
- Some apps ask for extra care when debugging is on, and banking apps may refuse to run while Developer options
  are on. That is the phone's choice; Android Link cannot change it.
- Copy and paste: the clipboard box sits behind the **⋮** (More) button next to the screen.
- Android Link keeps its paired phones and its adb key on its data volume: if you remove the app with its data,
  pair the phones again.
