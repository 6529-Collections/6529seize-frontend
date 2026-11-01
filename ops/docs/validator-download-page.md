# Validator download page

Parent: [Documentation](README.md)

## Overview

`/validator` is where testers download the 6529 validator. A password
protects every page under it, except the signed release feed, which
validators fetch to find updates.

| Route | What it serves | Access |
| --- | --- | --- |
| `/validator` | The downloads of the newest release, with SHA-256 | Password |
| `/validator/guide` | The tester guide | Password |
| `/validator/known-issues` | Known issues and workarounds | Password |
| `/validator/releases` | Every release, newest first, with its files' SHA-256 | Password |
| `/validator/download/<version>/<file>` | A 302 to a presigned S3 URL that works for 5 minutes | Password |
| `/validator/download/<file>` | The same, for the newest release that has the file | Password |
| `/validator/releases.json` | The signed release feed, byte for byte | Public |
| `/validator/releases.json.sig` | The feed's signature, byte for byte | Public |

The pages send `noindex, nofollow`, and the sitemap leaves them out.
`robots.txt` does not name them.

## The password gate

`proxy.ts` calls `lib/validator-page/proxyGate.ts` for every path under
`/validator`. A request without a valid cookie gets the password form in
place of the page it asked for. Each page and the download route check the
cookie again.

- The form posts to `/validator/unlock`. Each address gets 10 tries in 15
  minutes, right or wrong.
- A correct password sets `validator_access`: `HttpOnly`, `Secure`,
  `SameSite=Strict`, path `/validator`, for 30 days. It holds an expiry and
  an HMAC whose key comes from the password through scrypt, so changing the
  password signs every tester out.
- A link from another site arrives without the `SameSite=Strict` cookie,
  so the gate reloads the page once from 6529.io, which sends it.

The password is never in the repository. Production reads it from the
`VALIDATOR_PAGE_PASSWORD` environment variable, which the
`Web Deploy - PROD` workflow copies from the `production` environment's
GitHub secret of the same name into the Elastic Beanstalk environment.

### Change the password

1. Set the new value:
   `gh secret set VALIDATOR_PAGE_PASSWORD --env production`.
2. Run `Web Deploy - PROD`. Testers then need the new password.

### Open the pages to everyone

Do either of these, then run `Web Deploy - PROD`:

- set the `production` environment variable `VALIDATOR_PAGE_PUBLIC` to
  `true`: `gh variable set VALIDATOR_PAGE_PUBLIC --env production --body true`;
- or delete the secret: `gh secret delete VALIDATOR_PAGE_PASSWORD --env production`.

The deploy then sets `VALIDATOR_PAGE_PUBLIC=true` on Elastic Beanstalk. To
open the pages without a deploy, set that property on the environment
directly; Elastic Beanstalk restarts the app with it. Remove the
`/validator` entries from the sitemap exclusions once the pages should be
found by search engines.

## Releases

The pages read everything about releases from a private S3 bucket in the
production account (`us-east-1`). Block Public Access is on and versioning
is on. The Elastic Beanstalk instance role reads it with its own short-lived
credentials; the `validator-releases-read` inline policy allows
`s3:GetObject` on `feed/*`, `releases/*` and `content/*` only. No AWS keys
are configured.

| Key | Content |
| --- | --- |
| `feed/releases.json` | The signed release feed |
| `feed/releases.json.sig` | Its signature |
| `releases/<version>/<file>` | Each release's files, `SHA256SUMS` and `release.json` included |
| `content/bootstrap-peers.json` | The addresses of 6529's sentries, for the guide's peer steps |

The sentry addresses stay out of this public repository. The guide holds
tokens such as `{{SENTRY_1_TCP}}`, and the page fills them from
`content/bootstrap-peers.json`: `sentries[0]` and `sentries[1]`, each with
`peer_id`, `tcp`, `quic` and `onion`. Upload a new file when an address
changes; the guide shows it within a minute.

The site reads the feed once a minute and keeps the last good copy for an
hour if S3 fails. It serves the two feed files unchanged, so the signature
verifies against what validators download. Only files the feed lists can be
downloaded.

### Add a release

No site deploy is needed.

1. Upload the verified release folder to `releases/<version>/`, and check
   each object's SHA-256 against `SHA256SUMS`.
2. Upload the new `feed/releases.json` and `feed/releases.json.sig`. Upload
   the feed last, so the page never lists a file that is not there yet.

The pages show the new release within a minute. The download buttons pick
each file by its name: `.dmg`, `-x64.msi`, `_amd64.deb`, `_arm64.deb`,
`-x86_64.AppImage`, and `validator-<version>-<target>` archives under
"Other downloads".

### The feed fields the site reads

Each entry of `releases` needs `version`, `channel` and `published_at` (an
ISO 8601 date or time), and may have `commit`, `software_id`, `notes` and
`files`. Each file needs `name` and a lowercase hex `sha256`, and may have
`size` in bytes. Entries and files that break these rules are left out.

## Text

The guide and the known issues are Markdown in
`lib/validator-page/content/`. Testers send status files and logs by
encrypted DM in the 6529 app to 6529's account, 6529validators
(`VALIDATOR_STATUS_DM_ACCOUNT` in `lib/validator-page/content/pageText.ts`).
