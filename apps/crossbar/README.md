# Crossbar

Your own browser, lent to your AI agents. Agents (Claude Code, OpenCode, anything that speaks MCP) read and act on
websites through a real Chromium on this machine, signed in as you, at a human pace. You stay in the loop from your
phone for anything a person should decide.

- Source code: https://github.com/carlosalaniz/crossbar-browser

**What it does.**

- **Agents connect over MCP.** The app's Connect page gives each agent its own token: *Read* (look, never change
  anything) or *Act*.
- **Anything with consequences waits for you.** Posting, paying, deleting and private messages ask for your approval
  on your phone first.
- **Logins, captchas and bot checks come to you.** You get a live view and can take over the browser from your phone.
- **Built to stay safe when a page tries to take over the agent** (prompt injection):
  - every write goes through a network gate;
  - after a signed-in read, data can't leak to a new site without asking you;
  - the browser can only reach the internet through Crossbar's own proxy.

**First start.** Sign in as `admin` with password `admin`, then change the password in Settings before you open
the app to anyone else.

**What Harbor asks you to allow.** Both permissions are for the browser container:

- **Change network settings (NET_ADMIN).** The browser locks itself down so its only way out is Crossbar's proxy,
  then drops the permission before Chromium starts.
- **Run a web browser's own sandbox.** Keeps Chromium's sandbox on, which isolates each website's process. Docker's
  default protection stays in place apart from four calls the sandbox needs.

**Options.**

- **Your time zone** and **Your language**: set them to match your own devices. Websites see both, and a mismatch is
  one of the things bot detection looks for.
- **Your home's public IP addresses**: pages can't reach them through the browser (so they can't reach your router
  from outside).

**Data.** Two storage areas, both kept when you remove the app:

- **App data:** accounts, agent tokens, keys and the activity log.
- **Browser profiles:** your website sign-ins.

Back up the first one.

Needs Harbor 0.46.0 or newer and an x86-64 machine.
