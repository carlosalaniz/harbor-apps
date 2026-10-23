# Plane

Plane is open-source project management: work items, cycles (sprints), modules, pages (docs), intake and
analytics, with Kanban, list, calendar, spreadsheet and Gantt views. This is Plane Community Edition.

- Website: https://plane.so/
- Source code: https://github.com/makeplane/plane
- Help: https://docs.plane.so/ and https://github.com/makeplane/plane/issues

## First start

The first start takes a few minutes: Plane runs its database migrations before it answers. Then open Plane,
choose **Get started** and set up the instance in **God mode** (`/god-mode/`): the first account you create there is
the instance administrator. Sign in and create your first workspace. Email (SMTP), sign-in methods and other
instance settings are in God mode as well.

## Every address works

Open Plane at any address Harbor gives it: `localhost`, the home network, the secure home-network address,
Tailscale or a domain. Signing in keeps you on the address you came from, and uploads go to it. Plane itself knows only
one address (its main one, `WEB_URL`); its proxy in this package turns Plane's redirects to that address into paths,
hands Plane the address the browser used (Harbor's secure LAN relay sends `127.0.0.1` as the host), and on plain http
drops the Secure flag Plane puts on its cookies when the main address is https.

Still on the main address: the links in Plane's emails (invites, notifications, password reset) and export
downloads. Sign-in with GitHub, Google or GitLab works at the address you register with that provider.

## What runs

Thirteen services from Plane's own self-host setup: the proxy (Plane's Caddy, with Plane's own routes and the address handling above), the web app, Spaces (public boards),
the God mode admin, the live (real-time) server, the API, a worker and a scheduler, PostgreSQL, Valkey (a cache, not
kept across restarts), RabbitMQ (background tasks) and MinIO (uploaded files). Harbor generates every password and
key. Plane's one-shot migrator runs as the first step of the API instead of as a service of its own.

Uploads are limited to 5 MB per file (Plane's default).
