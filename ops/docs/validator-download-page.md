# Validator download page

Parent: [Documentation](README.md)

## Overview

`/validator` is where testers download the 6529 validator. When the
password gate is on, it protects every page under it, except the signed
release feed, which validators fetch to find updates, and the authorize
page.

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
| `/validator/authorize` | A phone signs a validator's authorization from its link (see [Authorize from a phone](#authorize-from-a-phone)) | Public |

The pages send `noindex, nofollow`, and the sitemap leaves them out.
`robots.txt` does not name them.

## The password gate

`proxy.ts` calls `lib/validator-page/proxyGate.ts` for every path under
`/validator`. A request without a valid cookie gets the password form in
place of the page it asked for. Each page and the download route check the
cookie again.

- The form posts to `/validator/unlock`. Each address gets 10 tries in 15
  minutes, right or wrong. Each server process also accepts at most 100
  wrong passwords in 15 minutes from all addresses together; after that the
  form asks everyone to wait until the window ends. Right passwords do not
  count toward that budget.
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
- The gate matches the path after decoding it once and folding repeated
  slashes, so `/%76alidator/<file>` and `/validator%2F<file>` are gated
  like `/validator/<file>`; a malformed escape cannot hide the prefix.

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

## Authorize from a phone

From rc.10, a validator's Authorize step shows a QR code and a link,
`/validator/authorize#<draft>`. The fragment holds the validator's draft
grant (the draft link, v1), so no server ever sees it. The page:

- rebuilds the typed data from the link, checks it, and shows the account,
  the keys with their shares, and the authorization number as it will be
  signed;
- names the network from the domain salt that is signed: only the mainnet
  salt is mainnet, any other salt carries the Test network tag, and a link
  for a test network that carries the mainnet salt is refused as damaged
  (the validator writes that salt only as the mainnet network byte);
- shows each key's 8-character code, as the validator's Keys page and
  Authorize step show it, and under it the whole public key in groups of
  8 hex characters, the last group the code. The code and the "this
  validator" mark both come from the link, so the page warns when keys
  not marked as this validator's hold a share of the authorization, and
  says how much;
- warns when the authorization number is above 1,000,000. The validator
  drafts one above the account's last, a later authorization needs a
  larger number, and the network keeps the greatest;
- asks the account's own wallet to sign, through the site's AppKit and
  without the site's sign-in prompt (`components/providers/Providers.tsx`);
- shows the signature to copy into the validator, which checks it against
  its own draft, with what it authorizes: the listed key codes, for the
  account, as that authorization number, and on a test network that it
  counts only there.

Nothing is stored or sent. The page is public, so the password gate never
locks it. The code is in `lib/validator-page/authorize/`. Its headings,
labels, signed-draft rows, stop text, signature card and copy states are in
the `validator-authorize` message namespace
(`i18n/messages/validatorAuthorize.en-US.json`, en-US only, other locales
fall back to it). The All files table's publisher column, its explanatory
paragraph and the download labels are in the `validator-files` namespace
(`i18n/messages/validatorFiles.en-US.json`, en-US only). Still English-only
strings in their components, with no other locale: the authorize page's
introduction, wallet step and no-link text, the checks' problem list, and
the rest of the other `/validator` pages.

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
verifies against what validators download.

Before it reads the feed, the site checks its signature as a validator
does (the validator's `docs/releases-feed.md`, "The signature"): ECDSA over
secp256k1 of SHA-256(`6529 Validator releases v1`, a zero byte, the feed's
bytes), by a key that `releases.json.sig` names by address and that
`lib/validator-page/feedSigningKeys.ts` lists. That file pins 6529's
release-list key, the one every validator release has built in; a
successor key is added there beside it before the old one is retired. A
missing signature, one that does not verify, or a feed whose `sequence` is
lower than one the server has already served counts as a failed read: the
last good copy stays for up to an hour, then the pages say the release
list could not be loaded, offer no download, and `releases.json` answers
503. The `sequence` floor is kept per server instance: each instance
remembers the highest `sequence` it has served in its own memory, instances
do not share it, and it starts again when an instance restarts.

The feed may be at most 56 KiB, the validator's own limit (it must fit one
gossip message with its signature). The live feed is about 30 KiB and grows
with each release; the producer drops the oldest test releases to stay
under the limit. A larger feed is refused here as every validator refuses
it, so the pages fall back to the error state above.

The SHA-256 on the pages therefore comes from the signed feed. The
"Publisher" column of All files says which name the visitor's system
should show for a file's code signature (6529 Collection LLC, and Apple's
notarization on the Mac files); the site does not check code signatures. Only the newest release's files
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
   Until both are in place the pair does not verify, and the site keeps
   the last good feed.

The pages show the new release within a minute. The download buttons pick
each file by its name: `.dmg`, `-Setup-<version>-x64.exe`, `_amd64.deb`,
`_arm64.deb` and `-x86_64.AppImage`. The big button is the visitor's
system, from the User-Agent (and, in Chromium, the CPU from its client
hints); "Other systems" lists all five. The page's heading and the line
under the big button name the offered release's full version, as the feed
gives it (`0.1.0-rc.9`), so a tester can tell which candidate it is; the
file names stay `0.1.0`'s. The Windows `-x64.msi` and the
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
from rc.9", `VALIDATOR_UPGRADE` in `guideMarkdown.ts`) shows under the
download button and at the top of the guide, with the section on Sunday's
switch (`VALIDATOR_SWITCH`) above it on both. Each shows only
while the release the pages offer is the one it names (`forVersion`). The hardware page's text and
numbers are in `hardwareText.ts` there, each checked against the release it
names.

A release fact that is not known when the text is written, such as the
day of a release's join tests, is written `{{RC10_JOIN_DATE}}` and the like.
The page tests allow only the placeholders `STILL_TO_FILL` in
`content.test.ts` names, so fill each one, everywhere it appears (the tests
too), before merging. Testers
post their results in the Ministry of Validation wave with the template in
`pageText.ts`, and post no logs or status files.
