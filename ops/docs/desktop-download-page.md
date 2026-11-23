# 6529 Desktop download page

Parent: [Documentation](README.md)

## Overview

`/desktop` is where people download 6529 Desktop's test release: the
6529.io experience as an installed app for Windows (64-bit) and macOS
(Apple silicon). Open the test-release card on [6529 Apps](navigation/feature-6529-apps-page.md)
or search for **6529 Desktop** in site search.

| Route                                | What it serves                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `/desktop`                           | What 6529 Desktop is, the newest release's downloads, every file with its SHA-256, how to check one, and feedback |
| `/desktop/guide`                     | Installing on Windows and a Mac, signing in, signing with a browser wallet, updating and uninstalling             |
| `/desktop/known-issues`              | What does not work yet in the test release                                                                        |
| `/desktop/releases`                  | Every release in the list, newest first, each under its version as anchor (the list's `notes_url`)                |
| `/desktop/download/<file>`           | For the newest release only, a 302 to a presigned S3 URL that works for 5 minutes                                 |
| `/desktop/download/<version>/<file>` | The same, with the newest release's version                                                                       |
| `/desktop/releases.json`             | The signed release list, byte for byte ([developer page](developer/desktop-release-list.md))                      |
| `/desktop/releases.json.sig`         | The list's signature, byte for byte                                                                               |

Every page shows, under its title, that 6529 Desktop is a test release,
that people should expect problems and not rely on it for anything that
matters, with a link to the known issues.

The pages send `noindex, nofollow` (their metadata, and the `X-Robots-Tag`
header that `config/nextConfig.ts` sets on `/desktop/:path*`), and
`next-sitemap.config.ts` leaves them out of the sitemap. The 6529 Help Bot
and header search link to the download page. Page views under `/desktop` are not
counted as profile views (`services/analytics/pageClassification.ts`).

The code is in `app/desktop/`, `components/desktop-page/` and
`lib/desktop-releases/`. The menu, notice, text-page body, file table,
command list, build line, figure and empty state live in
`components/release-section/`, and the download route's path rules and
answer in `lib/release-section/download.ts`, written so the 6529 AI pages
can use them too (they do not yet).

## Before a list is published

Until the bucket holds a list:

- `/desktop` says no release is published yet, offers no download, and
  still shows what 6529 Desktop is, that Linux comes later, and where to
  give feedback.
- `/desktop/guide` reads in full, and describes the installers ("the
  Windows installer you downloaded") instead of naming them.
- `/desktop/known-issues` reads in full; it needs no list.
- `/desktop/releases` says no release is published yet.
- Every `/desktop/download/...` path answers 404, and
  `/desktop/releases.json` and `.sig` answer 404 `No release list yet.`

## Releases

The pages read the same list `/desktop/releases.json` serves, from the
bundle `feed/releases.bundle.json` in the private bucket
`6529-desktop-releases-06c6aa2e` in `us-east-1` (built into
`lib/desktop-releases/releaseList.ts`; `DESKTOP_RELEASES_BUCKET` and
`DESKTOP_RELEASES_REGION` override it). The release files are in the same
bucket:

| Key                         | Content                                                  |
| --------------------------- | -------------------------------------------------------- |
| `feed/releases.bundle.json` | The list and its signature, one object                   |
| `releases/<version>/<file>` | Every file the list names for that release, by that name |

The production servers' instance role may read `feed/*` and `releases/*`
and list the bucket, so a missing object is a 404. For 0.1.0-rc.2 the
publisher writes, besides the bundle, each file the list names under
`releases/0.1.0-rc.2/`, such as
`releases/0.1.0-rc.2/6529-Desktop_0.1.0-rc.2_windows-x64-setup.exe`,
`releases/0.1.0-rc.2/6529-Desktop_0.1.0-rc.2_macos-arm64.dmg` and
`releases/0.1.0-rc.2/SHA256SUMS`.

### The signature

The list has the validator's format (6529 Desktop's `docs/updates.md`,
section 1). Before the pages read anything from it, the site checks its
signature as the app does: ECDSA over secp256k1 of
SHA-256(`6529 Desktop releases v1`, a zero byte, the list's bytes), by a
key that `lib/desktop-releases/signingKeys.ts` lists. That file pins the
6529 Desktop release key in AWS KMS, alias `alias/6529-desktop-releases`,
address `0xf91Ed41FE48448395Ac484f678a2E52fA922d055`, the only key in the
app's `updates::TRUSTED_KEYS`. The validator's list fails this check (other
domain, other key), and the reverse.

A signature that does not verify, a list whose `format` is not 1, or a
bucket error means the pages offer nothing: the download page says the
release list could not be loaded, and every download answers 503. The
routes `releases.json` and `.sig` still serve what the bucket holds; the
app checks it.

The site checks each list once (per server, per list read). It keeps no
`sequence` floor of its own: the pages show the list the routes serve.

### The fields the pages read

Each release needs `version`, `channel` and a `date` (or `published_at`),
and may have `commit` and `notes`. Each file needs `name` and a hex
`sha256`, and may have `size`. The newest release is the one with the
highest version. Only its files can be downloaded; older releases are on
`/desktop/releases` with their SHA-256 and no download link.

The buttons pick the installers by name: `_windows-x64-setup.exe` (Windows)
and `_macos-arm64.dmg` (Mac). The big button is the visitor's system, from
the User-Agent; any other system gets both. `SHA256SUMS` opens as text and
`release.json` as JSON; every other file downloads under its name.

### Add a release

No site deploy is needed. Upload the release's files to
`releases/<version>/` (check each against `SHA256SUMS`), then publish the
new bundle with 6529 Desktop's `packaging/releases-feed.sh publish`. The
pages show the new release within a minute.

## Screenshots

The guide shows two real captures of the app, cropped to its own window or
dialog, in `public/desktop/`: the first launch on a Mac, and the signature
request dialog with its request code and content fingerprint. Before adding
one, check that it shows no other person's handle, wave content, address or
account detail.

## Text

All copy is in the `desktop-download` message namespace
(`i18n/messages/desktopDownload.en-US.json`), including the guide and the
known issues, which are Markdown messages. Only en-US exists; other
locales fall back to it (fallback debt for `/desktop/*`: all copy). The
download route's 404 and 503 bodies are messages too, since a person can
read them in a browser tab; the `releases.json` routes' bodies stay plain
protocol text for the app, as the validator's and 6529 AI's do. File names, commands, the
publisher name and the key's address stay as written in every language.

The known issues are the ones verified for the first signed test builds;
update them with each release. Feedback goes to the public "6529 Desktop"
wave, a subwave of Ministry of Validation, with a report template: the
system and its version, the app version shown in the title bar, what you
did, what happened, and a screenshot.

## Connect an account

On 6529.io, open the account menu, select **Connect Device**, and choose
**6529 Desktop**. Choose **Connect only** or **Connect with Post Signing & DM
Encryption**, then open the link and accept the connection in the app. On
staging, **Open in 6529 Desktop** opens Waves in the installed app. For account
connection, use [Connect Device on 6529.io](navigation/feature-share-modal.md#connect-device).
