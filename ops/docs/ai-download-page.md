# 6529 AI download page

Parent: [Documentation](README.md)

## Overview

`/ai` is where people download 6529 AI's test release. No menu, header,
footer, search result or other page links it yet: the owner looks at it
first, then adds the link. It has no password.

| Route                           | What it serves                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/ai`                           | The newest release's downloads, every file with its SHA-256 and publisher, and how to check a file |
| `/ai/guide`                     | Installing on a Mac, Windows and Linux, and the first chat                                         |
| `/ai/known-issues`              | What nobody has tried yet                                                                          |
| `/ai/download/<file>`           | For the newest release only, a 302 to a presigned S3 URL that works for 5 minutes                  |
| `/ai/download/<version>/<file>` | The same, with the newest release's version                                                        |
| `/ai/releases.json`             | The signed release feed, byte for byte                                                             |
| `/ai/releases.json.sig`         | The feed's signature, byte for byte                                                                |

Every page shows, under its title, that 6529 AI is untested, that this is a
test release, that people should expect problems and not rely on it for
anything that matters, with a link to the known issues.

The pages send `noindex, nofollow` (their metadata, and the
`X-Robots-Tag` header that `config/nextConfig.ts` sets on `/ai/:path*`),
and `next-sitemap.config.ts` leaves them out of the sitemap. `robots.txt`
does not name them. The 6529 Help Bot corpus (`ops/help/help-index.json`)
and the header search leave them out too, until the owner links the
section.

The code is in `app/ai/`, `components/ai-page/` and `lib/ai-page/`. It uses
the validator page's AWS request signing (`lib/validator-page/sigv4.ts`),
instance-role credentials (`awsCredentials.ts`), visitor system detection
(`detectSystem.ts`, `useVisitorPlatform.ts`), version order
(`releaseFeed.ts`), Markdown and button styles; the validator's pages are
unchanged.

## Releases

The pages read everything about releases from the private bucket
`6529-ai-releases-4d7e988d` in the production account (`us-east-1`). Block
Public Access is on and versioning is on. The Elastic Beanstalk instance
role reads it with its own short-lived credentials; its inline policy
`ai-releases-read` allows `s3:GetObject` on `feed/*` and `releases/*` only.
No AWS keys are configured.

| Key                         | Content                                    |
| --------------------------- | ------------------------------------------ |
| `feed/releases.json`        | The signed release feed                    |
| `feed/releases.json.sig`    | Its signature                              |
| `releases/<version>/<file>` | Every file the feed lists for that release |

The role may not list the bucket, so S3 answers a key that isn't there
with 403 `AccessDenied`, not 404. The site reads that answer, like a 404,
as no feed: the download page then says there is no release yet and
offers no download, `releases.json` answers 404, and every download
answers 404. A role that loses its read permission looks the same. Any
other S3 failure is an error, as below.

The site reads the feed once a minute and keeps the last good copy for an
hour if S3 fails. It serves the two feed files unchanged, five minutes in
caches, so the signature verifies against what anyone downloads.

### The signature

Before it reads the feed, the site checks its signature. `releases.json.sig`
is JSON: `algorithm` `ed25519-sha256`, `public_key` (64 hex digits) and
`signature` (128 hex digits), an Ed25519 signature (RFC 8032) over
SHA-256(`6529 AI releases v1`, a zero byte, the feed's bytes as stored). The
key it names must be one that `lib/ai-page/feedSigningKeys.ts` lists. That
file pins 6529 AI's release key in AWS KMS, alias `alias/6529-ai-releases`,
whose public half is also 6529 AI's `deploy/release/release-key.pub`. A
successor key is added there beside it before the old one is retired.

A missing signature, one that does not verify, a feed larger than 64 KiB,
a feed whose `format` is not `6529-ai-releases/1`, or one whose `sequence`
is lower than one the server has already served counts as a failed read:
the last good copy stays for up to an hour, then the download page says
the release list could not be loaded, offers no download, and
`releases.json` answers 503. Each server instance keeps its own `sequence`
floor in memory; it starts again when the instance restarts.

The SHA-256 on the pages therefore comes from the signed feed. The
Publisher column shows each file's `signed` field: the name the visitor's
system should show for the file's code signature. The site does not check
code signatures.

The download page shows how to check `SHA256SUMS.sig`, the release key's
Ed25519 signature of `SHA256SUMS`, with OpenSSL 3, and the key as PEM. It
derives the PEM from the first key in `feedSigningKeys.ts`, so it assumes
the key that signs the feed also signs `SHA256SUMS`, as 6529 AI's release
tool does today.

### The feed fields the site reads

The feed is `{format, sequence, published, releases}`. Each release needs
`version` (Semantic Versioning, such as `0.1.0` or `0.1.0-rc.2`), `date`
(`YYYY-MM-DD`) and `channel`, and may have `commit` (hex) and `notes`
(plain text, shown under the download). Each file needs `name` and a hex
`sha256`, and may have `size` in bytes, `system` and `signed`. Releases and
files that break these rules are left out. A file name may not hold `/`,
`\`, `..` or a control character, or start with a dot.

The newest release is the one with the highest version; dates and the
feed's order play no part. Only its files can be downloaded. An older
release stays in the feed, but its files answer 404.

The buttons pick each package by its `system` and its name:

| `system`            | Button            | File         |
| ------------------- | ----------------- | ------------ |
| `macos-arm64`       | Mac               | `.dmg`       |
| `windows-x64`       | Windows           | `-setup.exe` |
| `linux-x86_64-cpu`  | Linux, x86-64     | `_amd64.deb` |
| `linux-x86_64-cuda` | Linux, NVIDIA GPU | `_amd64.deb` |
| `linux-arm64-cpu`   | Linux, ARM64      | `_arm64.deb` |

The big button is the visitor's system, from the User-Agent (and, in
Chromium, the CPU from its client hints). A Linux visitor whose CPU the
page can't tell gets both Linux buttons; an x86-64 Linux visitor also
gets the CUDA package. Other systems lists all five. The `.tar.gz`
packages and the release list's own files (`SHA256SUMS`,
`SHA256SUMS.sig`, `manifest.json`, with `system` null) are in All files.

### Add a release

No site deploy is needed.

1. Upload the release's files to `releases/<version>/`, and check each
   object's SHA-256 against `SHA256SUMS`.
2. Upload the new `feed/releases.json.sig` and `feed/releases.json`, the
   feed last, with a `sequence` higher than the last feed's. Until both
   are in place the pair does not verify, and the site keeps the last good
   feed.

The pages show the new release within a minute.

## Text

The download page's copy, the menu and the untested notice are in the
`ai-download` message namespace (`i18n/messages/aiDownload.en-US.json`).
Still English in code: each file's description and the button summaries
(`lib/ai-page/releaseFiles.ts`), and the "Copy"/"Copied" prefix of the
validator's `CopyChecksumButton.tsx`. The guide and the known issues are
Markdown in `lib/ai-page/content/`, en-US only. File names, commands and
the key stay as written in every language.

The guide is built from 6529 AI's own install guides
(`docs/install/macos.md`, `windows.md`, `linux.md` and
`getting-started.md`) and fills in the newest release's file names, or
`<version>` while there is none. Its Windows step names the installer's
publisher when the feed gives one, and says SmartScreen warns when the
feed says it is unsigned. The known issues come from those guides' notes
on what was tested; update them as 6529 AI is tested further.

The first release, release candidate 1 (`0.1.0-rc.1`), runs models on the
person's own computer only, and its app hides the 6529 AI network. So the
guide leaves out every network step (models from other providers, serving
to others, linking an account), the known issues say nothing about the
network, and the download page says only, in its lead, that the network
comes later with the chain integration. When a release turns the network
on, add its steps from 6529 AI's `use-the-network.md`,
`serve-and-offer.md` and `link-account.md`, and its known issues.

## Link it from the site

When the owner has seen it: add the menu or page link, add the section to
the Help Bot corpus and the header search, and decide whether the pages
should be found by search engines (the `X-Robots-Tag` rule in
`config/nextConfig.ts`, the sitemap exclusions and each page's metadata).
