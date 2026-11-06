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
| `/validator/hardware` | What computer the validator needs, with rc.5's systems and measured use | Password |
| `/validator/known-issues` | Known issues and workarounds | Password |
| `/validator/releases` | Every release, newest first, with its files' SHA-256; only the newest has download buttons, and an unsafe release none | Password |
| `/validator/download/<version>/<file>` | For the newest release only, a 302 to a presigned S3 URL that works for 5 minutes | Password |
| `/validator/download/<file>` | The same, for the newest release | Password |
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
  so the gate reloads the page once from 6529.io, which sends it. The
  reload keeps the link's section: the validator's Tor screens and its
  Report a problem (from rc.8) link `/validator#send-feedback`, and the
  password form carries the section to `/validator/unlock` and back. Keep
  the `send-feedback` id on the download page.

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
`s3:GetObject` on `feed/*` and `releases/*` (and on `content/*`, which the
pages no longer read). No AWS keys are configured.

| Key | Content |
| --- | --- |
| `feed/releases.json` | The signed release feed |
| `feed/releases.json.sig` | Its signature |
| `releases/<version>/<file>` | Each release's files, `SHA256SUMS` and `release.json` included |

Peer addresses never go on the pages or in this public repository. From
0.1.0-rc.5 testers add no peers, so the guide names none.

The site reads the feed once a minute and keeps the last good copy for an
hour if S3 fails. It serves the two feed files unchanged, so the signature
verifies against what validators download. Only the newest release's files
can be downloaded: an older release stays in the feed and on the history
page, with its SHA-256, and its files answer 404 (the owner: rc.1 to rc.4
never, and rc.5 not once rc.6 is out). Newest is by version, as the
validator orders its signed list (Semantic Versioning: `0.1.0-rc.7` <
`0.1.0-rc.10` < `0.1.0` < `0.1.1-rc.1`); dates play no part.

### Add a release

No site deploy is needed.

1. Upload the verified release folder to `releases/<version>/`, and check
   each object's SHA-256 against `SHA256SUMS`.
2. Upload the new `feed/releases.json` and `feed/releases.json.sig`. Upload
   the feed last, so the page never lists a file that is not there yet.

The pages show the new release within a minute. The download buttons pick
each file by its name: `.dmg`, `-Setup-<version>-x64.exe`, `_amd64.deb`,
`_arm64.deb` and `-x86_64.AppImage`. The big button is the visitor's
system, from the User-Agent (and, in Chromium, the CPU from its client
hints); "Other systems" lists all five. The Windows `-x64.msi` and the
`validator-<version>-<target>` archives are under "Linux and the
terminal" and "All files and checksums"; in a release without a
`Setup.exe`, the `.msi` takes the Windows button. From rc.8 a release also
carries `lyrebird-<version>-source.tar.gz`, the source of Tor's bridge
program, which the validator includes under the GPL; it is listed under
"All files and checksums" and on the history page.

### The feed fields the site reads

Each entry of `releases` needs `version`, `channel` and `published_at` (an
ISO 8601 date or time), and may have `commit`, `software_id`, `notes` and
`files`. Each file needs `name` and a lowercase hex `sha256`, and may have
`size` in bytes. Entries and files that break these rules are left out.

From rc.9 the site also reads the fields that mark a release urgent or
unsafe (the validator's `crates/releases/src/feed.rs`). A reason is one
line of plain text; the site cuts it at 300 characters and leaves out one
with a control character.

| Field | What the pages do with it |
| --- | --- |
| `severity`, `reason` (per release) | When the offered release is `urgent`, or has a severity the site doesn't know, the download page shows its reason above the download. Absent or `normal`: no notice. |
| `min_supported`, `deadline`, `deadline_reason` | Shown in that notice: "If you run a release before `min_supported`, update by `deadline`", then `deadline_reason`. A `deadline` counts only in the form `YYYY-MM-DDTHH:MM:SSZ` and with a valid `min_supported`, as in the validator. |
| `unsafe_versions: [{version, reason}]` | The releases page marks each listed release Unsafe, with its reason, and never as Latest. If the newest release is listed, no release is offered: the download page says why, and its files answer 404. |

## Text

The three steps are in `components/validator-page/ValidatorSteps.tsx`, with
their pictures in `public/validator/`: drawings of the macOS and Windows
dialogs, and screenshots of the release's app. The guide's closed sections
and the known issues are Markdown in `lib/validator-page/content/`, built
from the tester package's TESTERS.md (its "More" sections) and
KNOWN-ISSUES.md. The note for testers on the last release ("Upgrading
from rc.8", `VALIDATOR_UPGRADE` in `guideMarkdown.ts`) shows under the
download button and at the top of the guide, and rc.9's section on
Sunday's switch (`VALIDATOR_SWITCH`) above it on the guide. Each shows only
while the release the pages offer is the one it names (`forVersion`). The hardware page's text and
numbers are in `hardwareText.ts` there, each checked against the release it
names.

A release fact that is not known when the text is written, such as the
day of a release's join tests, is written `{{RC9_JOIN_DATE}}` and the like.
The page tests allow only the placeholders `STILL_TO_FILL` in
`content.test.ts` names, so fill each one, everywhere it appears (the tests
too), before merging. Testers
post their results in the Ministry of Validation wave with the template in
`pageText.ts`, and post no logs or status files.
