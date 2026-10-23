# harbor-apps

The official app catalog for [Harbor](https://github.com/carlosalaniz/harbor): every app you see in a
Harbor box's App Store comes from this repository.

Each app is a data-only package: a manifest, a Compose subset with images pinned by digest, a README and
a `release.json` with file hashes. No code runs from here; Harbor validates every package before it lists it.

## Layout

```
apps/index.json          the list of apps: id -> { revision, dir, optional minHarbor (equal to the manifest's) }
apps/<id>/manifest.yaml  what Harbor needs to know (endpoints, storage, health, presentation)
apps/<id>/compose.yaml   the services, Compose subset only, images pinned by digest
apps/<id>/README.md      shown in the App Store
apps/<id>/release.json   sha256 of every file, image digests, qualification result
apps/<id>/icon.svg|png   the app's icon: required here (CI checks it), up to 256 KiB (plus optional screenshots)
scripts/subset.mjs       CI helper: a catalog dir with only some apps (to check them with an older Harbor)
scripts/require-icons.mjs CI check: every app names an existing .svg/.png icon in presentation.icon
updates.json             rules for the automatic upstream updates (updates.yml)
```

## Add or update an app

The package format is described in Harbor's
[DEVELOPER_PACKAGES.md](https://github.com/carlosalaniz/harbor/blob/main/docs/DEVELOPER_PACKAGES.md).
Follow it; the short version:

1. Keep a checkout of Harbor next to this one (`../harbor`) and run its tools from there. They find
   `../harbor-apps/apps` on their own (or pass `--catalog <dir>`, or set `HARBOR_CATALOG_DIR`).
2. Edit `apps/<id>/`. Raise `release.revision` in the manifest **and** the app's `revision` in
   `apps/index.json` on every change: a higher revision is what makes Harbor offer an update.
3. Pin new images to digests: `node scripts/catalog-pin.mjs <id>` (in the Harbor checkout).
4. Refresh the hashes: `pnpm catalog:hash <id>`, then check everything: `pnpm catalog:verify`.
5. Open a pull request. CI runs the same checks with the latest Harbor release and with the one your app declares (below).
   `qualify.yml` also smoke-tests every app the pull request adds or changes on a GitHub runner (x86-64 Ubuntu, real
   Docker, Harbor's own engine: a changed app is installed at main's revision and updated, then every app gets a fresh
   install). For a branch of this repository it records each pass as the app's qualification on the branch.

Qualification (`"status": "passed"` in `release.json`) only ever comes from Harbor's
`scripts/vm/qualify-catalog.mjs` run on a disposable droplet, or from `pnpm catalog:smoke --record` on a GitHub runner
(`qualify.yml`, `updates.yml`). Never set it by hand.

### minHarbor: the oldest Harbor your app runs on

Each app declares it in its manifest, as part of its contract:

```yaml
release:
  revision: "3"
  minHarbor: "0.30.0"   # example; optional, absent means 0.28.0 (the first Harbor that downloads catalogs)
```

- Leave it out unless your app uses something an older Harbor does not know (a new manifest field, a new
  Compose key, a new value). Then set it to the first Harbor release that accepts it.
- It must be a published Harbor release (`x.y.z` written like the tag, no leading zeros: a GitHub release
  `v<x.y.z>` of [carlosalaniz/harbor](https://github.com/carlosalaniz/harbor) that is not a draft or
  prerelease), and **0.28.2 or newer** when you set it: 0.28.2 is the first Harbor that knows the field
  (0.28.0 and 0.28.1 would refuse the manifest). Leaving it out means 0.28.0.
- The app's folder must be named like its id (`apps/<id>/`, `"dir": "<id>"` in `apps/index.json`); Harbor
  refuses anything else.
- You do not need to set it in `apps/index.json`. If you do, it must equal the manifest's.

CI proves the claim. It validates your app with that exact Harbor release (its tag resolved to a commit,
which must be on Harbor's `main`, and that exact commit checked out with the Node and pnpm its own
`package.json` names) and with the latest Harbor release. The package format only grows, so passing
on both means every Harbor in between accepts it too. There is no pin to bump: CI always uses the latest
release, and your declaration names the oldest.

The bundle job copies each app's `minHarbor` into its entry of the published `index.json`. A box older than
that still lists the app, but as unavailable ("needs Harbor x.y.z or newer"), and never installs or updates it.

## How publishing works

Every push to `main` that touches `apps/`, `scripts/` or the workflow runs four jobs in
`.github/workflows/ci.yml`. Pull requests and manual runs on other branches run only the first two.

1. **plan** takes the latest published Harbor release, groups the apps by their declared `minHarbor`
   (`pnpm catalog:plan` in that release) and checks that every declared version is a published Harbor
   release whose tag commit is on Harbor's `main`. A bad declaration fails here, with the app's name.
   `pnpm catalog:plan` exists from Harbor 0.28.2: while the latest Harbor release is older, this job fails
   with "the latest Harbor release (vX) has no catalog:plan; release Harbor 0.28.2 or newer first".
2. **check** runs once per version, for example "check with Harbor 0.28.0 (15 apps)": Harbor at that
   release validates the apps that declare it (`pnpm catalog:verify` on a catalog of just those apps). The
   latest release validates every app and checks that the `release.json` hashes are current.
3. **bundle** builds `apps/` into `catalog.zip` plus `catalog.json` (the zip's sha256 and size, the
   commit and the serial) with the latest Harbor release's tools, plus a `summary.json` (each app's id,
   revision, version and minHarbor), and uploads them as a workflow artifact. It has read access only and
   no token.
4. **publish** downloads that artifact, checks it is this commit's bundle, signs `catalog.json` with
   Harbor's release key (the secret `HARBOR_SIGNING_KEY`, openssl only; the job fails without the secret or
   when it is not the key Harbor pins) and creates a GitHub release tagged `c<serial>` with `catalog.zip`,
   `catalog.json` and `catalog.json.sig`, marked latest. The notes are built with `jq`
   from `summary.json` and list the apps and the Harbor versions that checked them. It is the only job that
   may write to the repository, it never checks out Harbor or installs anything, the write token is
   passed only to its two `gh` steps, and the signing key only to its signing step.

The serial is the commit's committer time (unix seconds). Harbor only ever moves to a higher serial, so:

- A commit dated more than 5 minutes in the future fails the bundle job: it would freeze every box until
  the clock caught up. Fix the clock and make a new commit.
- A re-run for a commit that is already released does nothing.
- A different commit in the same committer second as an existing release fails: make a new commit.
- A commit older than the latest release is skipped when `main` has already moved on (the newer commit
  publishes). When it is still `main`'s tip, that is clock skew and the job fails: make a new commit.

Harbor boxes (0.28.0 and newer) check for a new catalog every 6 hours, or right away with **Check for new apps** in the
console or `harbor catalog refresh`. Each Harbor release also ships the latest catalog, so a new or
offline box has apps from the start.

## Automatic upstream updates

`.github/workflows/updates.yml` keeps the apps on their projects' releases (Harbor decision 175). Every day (or
**Run workflow** in the Actions tab, optionally for some app ids, or as a dry run):

1. **find** lists newer image tags with the latest Harbor release's `pnpm catalog:upstream check`: only tags of the
   same shape as the pinned one (`v0.11.3` → `v0.12.0`, never `-cuda`, `latest` or a date tag), at least 2 days
   old, with a linux/amd64 image newer than the pinned one. Images from one publisher on one tag move together
   (Immich's server and machine-learning). Infrastructure services and databases stay on their major version.
   Updates that already have an open pull request or issue are left out; at most 8 apps per run.
2. **try**, one job per app: `catalog:upstream apply` re-pins the images, raises the revision and moves the version
   in `release.version` and the release notes; `catalog:verify` checks it; `catalog:smoke` runs Harbor's own engine
   on the runner's Docker: it installs the current revision, updates it to the new one (no rollback, still healthy a
   minute later), then installs the new one from nothing. A pass becomes the app's qualification.
3. **land**, the only job that writes (it runs no package or Harbor code):
   - patch and minor updates that passed are committed to `main`, and the catalog workflow is started for it
     (pushes made by a workflow start no workflow by themselves);
   - major updates (a new major version, and 0.x minor versions such as 0.11 → 0.12) that passed go to a pull
     request from `updates/<id>` for a person to merge after reading the project's upgrade notes;
   - failures open an issue labelled `app-update` with what broke (Harbor's events and the containers' logs).

Steer it per app in [`updates.json`](updates.json):

```json
{
  "schemaVersion": 1,
  "defaults": { "minAgeDays": 2 },
  "apps": {
    "immich": { "hold": ["database"], "note": "why" },
    "some-app": { "skip": "why it is left alone" },
    "other-app": { "match": { "web": "^2\\." } }
  }
}
```

`hold` lists services that never move, `skip` leaves the whole app alone (say why), `match` is a pattern a new tag
must also match. For the pull requests, **Settings → Actions → General → Allow GitHub Actions to create and
approve pull requests** must be on; without it the bot opens an issue with a link to the branch instead.

## Trust

One key signs Harbor releases and this catalog (Harbor decision 168; custody, rotation and what to do if it
leaks: Harbor's `docs/design/SIGNING.md`). The publish job writes `catalog.json.sig`, the base64 Ed25519
signature over the exact bytes of `catalog.json`. Harbor 0.32.0 and newer resolve the latest release to its
tag once, download `catalog.json`, `catalog.json.sig` and `catalog.zip` from that tag, and use the catalog
only when a key pinned in Harbor verifies the signature; an unsigned or badly signed catalog is refused and
the box keeps the one it has. Older Harbors (0.28 to 0.31) ignore the signature and trust HTTPS to GitHub.

`catalog.json` pins `catalog.zip` by sha256 and size, so the signature covers the archive too. A box also
refuses a catalog that is older than the one it has, dated more than a day in the future, too large, or
that does not validate, and keeps the one it has.

What goes into a release rests on this repository's reviewed commits and on published Harbor releases (the
latest one, plus the ones apps declare), each checked out at its tag commit on Harbor's `main` and installed
from its lockfile with the toolchain it names.
