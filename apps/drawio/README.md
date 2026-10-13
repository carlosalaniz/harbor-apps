# draw.io

A diagram editor that runs in your browser: flowcharts, org charts, mind maps, UML, network and database
diagrams, with large shape libraries and templates. This package runs the editor the draw.io team
publishes as a container (`jgraph/drawio`) on your own machine.

- Website: https://www.drawio.com
- Source code: https://github.com/jgraph/drawio (the container: https://github.com/jgraph/docker-drawio)
- Help: https://www.drawio.com/doc/

## First run

Nothing to set up and no first-run questions: the app opens straight on a blank diagram (File → New has
the templates). The first time you save (File → Save), pick a place under **Where**:

- **Device** (Chrome and Edge on a secure address): a `.drawio` file on your computer that later saves go
  straight back to.
- **Download**: the file is downloaded, a new copy on every save. Other browsers and plain http get this
  instead of Device.
- **Browser**: kept in this browser's storage for this address.

## What is stored where

- Harbor stores nothing for this app: no volume, no database, no account. Removing it loses nothing on the
  server, and Harbor backups have nothing to capture.
- Diagrams saved to **Browser** live only in that browser, under the exact address you opened (the LAN
  address, the Tailscale address and a domain each get their own). Clearing the browser's site data deletes
  them. Save important diagrams to your device as well.
- The cloud storage options (Google Drive, OneDrive, Dropbox, GitHub, GitLab, Trello), real-time
  collaboration and the image proxy are off.

## Limits on Harbor

- **No login.** Anyone who can open the address can use the editor (they cannot see your browser-saved
  diagrams, which never leave your browser). That is fine on this machine, your home network or your
  tailnet. On a public domain Harbor asks for a basic-auth password by default (shown once): keep it on,
  and never publish with `--protect none` or through **Your own proxy**, which adds no password.
- **Publish → Link** and **Embed → IFrame** (with or without Lightbox) open the diagram on this machine's
  main address, so they work only where that address can be reached. Changing the main address does not
  update links you already shared.
- An **Embed → HTML** snippet and the page **Export as → HTML** writes load draw.io's viewer from the main
  address too, but clicking the diagram (its lightbox) or Edit opens it on draw.io's own
  `viewer.diagrams.net` / `app.diagrams.net`, which then receive the diagram. Use Publish → Link to keep a
  shared diagram on this machine.
- There is no export server: PNG, JPEG and SVG are made in the browser, and PDF goes through the browser's
  print dialog.
- On plain http the editor works, but the system clipboard and saving straight back to a file need a secure
  address (secure LAN, Tailscale or a domain).
- The image is large for a static editor (Tomcat and Java: a 400 MB download, about 1.3 GB on disk).
- draw.io's team describes the `jgraph/drawio` image as a test version for trying draw.io out (they sell a
  production version), and rebuilds it every week from their current code, so `32.4.1` can contain changes
  made after that release. Harbor pins the build it tested by digest.

## License

The draw.io code is Apache-2.0. Its icon sets, shape libraries and templates come with extra terms (no use in
Atlassian products without permission). draw.io is a trademark of draw.io Ltd; this package is not made or
endorsed by them.
