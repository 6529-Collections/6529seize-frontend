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
| `/ai/known-issues`              | What hasn't been tested yet, with workarounds                                                      |
| `/ai/download/<file>`           | For the newest release only, a 302 to a presigned S3 URL that works for 5 minutes                  |
| `/ai/download/<version>/<file>` | The same, with the newest release's version                                                        |
| `/ai/releases.json`             | The signed release feed, byte for byte                                                             |
| `/ai/releases.json.sig`         | The feed's signature, byte for byte                                                                |

Every page says, right under its title, that 6529 AI is untested, that
this is a test release, and that people should expect problems and not
rely on it for anything that matters: the download page and the guide in a
one-line notice that links the known issues, and the known issues in their
own lead.

## The pages

- **Download** (`/ai`): a headline and one-line lead, the notice, then the
  big download button for the visitor's system with the version, size and
  system needs under it, "Signed by" and "Notarized by Apple" badges from
  the feed, and "Also for" links to the other systems. A phone, or anything
  the page can't tell is a computer, gets "Open this page on your computer"
  with a Copy link (or Share link) button and a row of Mac, Windows and
  Linux buttons instead. Then "How it works" in three steps, and
  Downloads. The Mac and Windows cards are one row each, with the system
  needs in the row's grey line; only the Linux card has a header, over
  its x86-64 / NVIDIA GPU / ARM64 switch for the `.deb` and
  `.tar.gz`. Each file has its badges, size, a "Copy SHA-256" button (the
  hash is never printed on the page, but screen readers get it whole) and
  its download. "Verify your download" is one closed section: checking a
  file against `SHA256SUMS`, checking `SHA256SUMS.sig` with OpenSSL 3 and
  the release key, the code signature, and downloads of `SHA256SUMS`,
  `SHA256SUMS.sig` and `manifest.json`.
- **Guide** (`/ai/guide`): a Mac / Windows / Linux tab control that opens
  on the visitor's system (the Mac for a phone). Each tab has what the
  computer needs with its download buttons, then numbered install steps.
  A step reads in order: what to do (with the default choice named), its
  command, what the person sees then, and the screenshot. On Linux each
  `apt install` label leads with the CPU ("x86-64 · amd64.deb"). Then how
  to open the page again, and closed Troubleshooting (where the log is)
  and Uninstall sections; Linux adds the `.tar.gz` for other
  distributions.
  Then the first chat, with `qwen3-4b-gguf` to try first, two short notes
  (running a validator on the same computer, and the OpenAI-compatible
  API), "Next: use it for real" to `/ai/use`, and "Report a problem".
- **Use it** (`/ai/use`): real use once 6529 AI is installed (one line
  sends anyone who hasn't installed it to the Guide): signing in,
  choosing, fetching and serving a model, chat, a question about a
  picture, images, speech, the Provider screen, app keys, the API (curl,
  Python and a coding tool), the command line, stopping a model, the page
  at phone width and uninstalling, then a line to Known issues and a
  footnote on the three computers the pictures come from. Its contents
  sit beside it from 1024 px and mark the section in view; on a phone a
  slim bar at the top says which section you are in and opens the list,
  and a button goes back to the top. Output a command printed is quieter
  than the command, with no bar, and folds behind "Show output" past ten
  lines.
- **Models** (`/ai/models`): every model in the 6529 AI registry, by
  section. A bar, held at the top from 1024 px, has a search (name,
  publisher or family: "qwen 8b"), an order (smallest memory first, newest
  first, by name), cards or a table, and filters for what runs in the app
  today, what a model reads and makes, and the memory it needs, with
  "Not sure what fits? The app's Start page tells you." A card has the
  name, the publisher linked to its files on Hugging Face at the pinned
  revision, one line on what it is, whether the app runs it (and why
  not), its facts, its versions and up to five scores, and 6529's own
  measured runs with the hardware. The table has a row a model (maker,
  smallest files and memory, whether the app runs it, and the section's
  common score where at least half its models report one) and a row
  opens its card. On a phone a card's versions and scores fold behind a
  button.
- **Known issues** (`/ai/known-issues`): the untested statement as the
  lead, the day the list last changed, a one-line "Found a problem? Report
  it" link, then **Known bugs** (each a card: what you see, the fix and
  its commands, and why in a line) and **Not tested yet** by system, and
  the full "Report a problem" card at the end.

"Report a problem" opens the 6529 AI wave, where testers and the support
bot answer, and says what to include: the system, the steps, what
happened, a screenshot and the log.

Every command, path and key is in a block with a label (Terminal,
PowerShell, the CPU) and a Copy button; a long line scrolls rather than
breaking, and fades at the right edge while more of it is hidden. Touch
targets are 44 px on a phone. The pages are dark-only, as the site is.

Three places on the first pages show a screenshot of the app, from the
walk-through's pictures: the download page's first screen shows Start's
model list, the guide's Mac step 4 the question whether a validator runs
on the same computer, and its first chat a chat reply. On a phone the
download page and the first chat show the app's own phone-width capture
instead. `lib/ai-page/screenshots.ts` names them.

## The pictures

The text of `/ai/use` is structured content in
`lib/ai-page/content/use/`, from 6529 AI's walk-through of release
candidate 1 (its `use.md` and the pictures beside it, taken on 16 and 17
November 2026), without the install, which the Guide has, the known
problems, which Known issues has, and the parts about the network. One
picture shows each state.

The pictures are in `public/ai/use/` (`ai` is in `PUBLIC_IMAGE_DIRECTORIES`
in `lib/proxy/publicPaths.ts`, as the public path contract asks): the dark
captures, each whole, as WebP (quality 80 for the 2x captures, lossless
for the 1x Windows dialogs; 30 files, about 1.8 MB).
`lib/ai-page/content/useImages.ts` gives each one's pixels, its `scale`
(file pixels to a CSS pixel) and its `crop`: the part a page shows, what
its step is about (the row, the button, the dialog). `AiZoomPicture`
shows the crop at its real size, or the column's width when that is less,
in the cards' 1 px border and radius, and a click opens the whole capture
at its real size in a dialog. Phone-width captures sit two to a row from
640 px and in a row that scrolls sideways on a phone. To change a
picture, put the new file in `public/ai/use/` and set its size and crop
in `useImages.ts`; a test reads each file's size and checks each crop
lies inside it.

## The models data

`lib/ai-page/content/models/models.json` and `sections.json` are written
by `build_models_page.py` in 6529 AI's `deploy/ai-page/` (format
`6529.io.ai-models.v1` and `6529.io.ai-model-sections.v1`), from the
registry at a given commit and the hand-written `curated.json` beside
it. When the registry changes, run the script's `fetch` and `build` steps
and copy the two files here, then run `node scripts/ai-models-published.cjs
lib/ai-page/content/models/models.json
lib/ai-page/content/models/published.json`, which reads, for each model,
the day its repository was made on Hugging Face (the original model's,
for a quantization, conversion or repackaging) for "Newest first".
Prettier leaves the three files as they are written.
`lib/ai-page/models.ts` reads them and gives the page each model's
facets for the search and the filter, its scores in one scale and the
section's common score.

The page shows the data as the build wrote it, with these rules of its
own:

- A percent is rounded to one decimal. A score out of a fixed maximum
  says so ("8.49 /10" for MT-Bench, "/1000" for OCRBench). A share of one
  that is an accuracy or a win rate (Arena Hard, MATH Maj@1, GenEval and
  the like) shows as a percent; any other score without a unit shows as
  its card gives it, rounded, since its scale isn't the page's to guess.
  In the table, a section's column shows a share of one as a percent when
  other cards give the same benchmark in percent.
- **orig.** marks a score whose note calls it the original model's, and
  "How to read this page" says so once.
- A model with no scores shows none: gpt-oss, whose publisher prints its
  scores only in a PDF, has no Scores list rather than an empty one.
- A measured run names its hardware ("8 × H200, 141 GB each"), not the
  cloud instance, and its note loses the sentences about the network, the
  demo catalog it came from and "No speed recorded."
- Publishers are credited by their name in the data, which for some
  models is a personal Hugging Face account, each linked to the model's
  files at the pinned revision.

The pages send `noindex, nofollow` (their metadata, and the
`X-Robots-Tag` header that `config/nextConfig.ts` sets on `/ai/:path*`),
and `next-sitemap.config.ts` leaves them out of the sitemap. `robots.txt`
does not name them. The 6529 Help Bot corpus (`ops/help/help-index.json`)
and the header search leave them out too, until the owner links the
section.

`/ai` is a site route, not a profile handle, in the lists that tell them
apart: page classification for analytics
(`services/analytics/pageClassification.ts`), the default page title
(`contexts/TitleContext.tsx`) and the monitoring route names
(`utils/monitoring/mobileLaunchTimingSanitizers.ts`). A link to
`https://6529.io/ai` in a drop opens the page in place, without a page
load, on the site, and so it does in the Playwright projects that stand
in for 6529 Mobile and 6529 Desktop. The 6529 Core desktop app runs its
own older copy of the site, which has no `/ai` (nor `/validator`): it
turns the same link into its own `/ai`, which its profile catch-all
answers with "not found". Only a 6529 Core release can change that.

The code is in `app/ai/`, `components/ai-page/` and `lib/ai-page/`. It uses
the validator page's AWS request signing (`lib/validator-page/sigv4.ts`),
instance-role credentials (`awsCredentials.ts`), visitor system detection
(`detectSystem.ts`, `useVisitorPlatform.ts`), version order
(`releaseFeed.ts`), the feed endpoints' response (`serveSignedFeedObject`
in `feedResponse.ts`), Markdown and button styles; the validator's pages
and endpoints answer as before.

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
answers 404. A role that loses its read permission looks the same, so a
feed that reads as missing after a verified one was served counts as a
failed read, as below, and reads as no feed only once the verified copy is
an hour old. Any other S3 failure is an error, as below.

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
floor and last good copy in memory, so during an S3 failure two instances
can answer differently; both start again when the instance restarts.

The SHA-256 on the pages therefore comes from the signed feed. The badges
come from each file's `signed` field: "Developer ID Application: 6529
Collection LLC, notarized by Apple" shows as "Signed by 6529 Collection
LLC" and "Notarized by Apple", the name the visitor's system should show
for the file's code signature. The site does not check code signatures.

The download page shows how to check `SHA256SUMS.sig`, the release key's
Ed25519 signature of `SHA256SUMS`, with OpenSSL 3, and the key as PEM. It
derives the PEM from the first key in `feedSigningKeys.ts`, so it assumes
the key that signs the feed also signs `SHA256SUMS`, as 6529 AI's release
tool does today.

### The feed fields the site reads

The feed is `{format, sequence, published, releases}`. Each release needs
`version` (Semantic Versioning, such as `0.1.0` or `0.1.0-rc.2`), `date`
(`YYYY-MM-DD`) and `channel`, and may have `commit` (hex) and `notes`
(plain text, which the pages don't show). Each file needs `name` and a hex
`sha256`, and may have `size` in bytes, `system` and `signed`. Releases and
files that break these rules are left out. A file name holds only
letters, digits and `._+~-`, never `..`, and starts with a letter or digit.

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
page can't tell gets the x86-64 and ARM64 buttons. The Linux card's switch
also opens on the visitor's CPU. The `.tar.gz` packages are in the Linux
card, and the release list's own files (`SHA256SUMS`, `SHA256SUMS.sig`,
`manifest.json`, with `system` null) in "Verify your download".

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

The pages' interface copy (the menu, the notice, buttons, headings,
labels, captions and the Verify steps) is in the `ai-download` message
namespace (`i18n/messages/aiDownload.en-US.json`), and sizes and dates go
through `@/i18n/format`. Still English in code: each file's description
and system needs (`lib/ai-page/releaseFiles.ts`), and the guide's steps
and the known issues, which are structured content in
`lib/ai-page/content/guide.ts` and `knownIssues.ts` with `**bold**`,
`*italic*` and `code` marked inline. File names, commands and the key stay
as written in every language.

Localization debt, en-US only today:

| Route              | Component and source                                           | What stays English                                                                     |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/ai`              | `AiDownloads`, `AiDownloadPage`; `lib/ai-page/releaseFiles.ts` | Each file's kind and system needs ("Disk image", "macOS 13.3 or later, Apple silicon") |
| `/ai/guide`        | `AiGuidePage`, `AiGuideSteps`; `lib/ai-page/content/guide.ts`  | Every step, result, need, code-block label and fold title                              |
| `/ai/known-issues` | `AiKnownIssuesPage`; `lib/ai-page/content/knownIssues.ts`      | Every issue, workaround and code-block label                                           |
| `/ai/use`          | `AiUsePage`, `AiUseBlocks`; `lib/ai-page/content/use/`         | The whole walk-through, its pictures' alt text and its code-block labels               |
| `/ai/models`       | `AiModelCard`; `lib/ai-page/content/models/*.json`             | Section titles and lines, model descriptions, notes and license summaries              |

These strings don't go through `t()`, so another locale sees them in
English beside its own interface copy, with no per-key fallback. To
localize them, move each string into the `ai-download` namespace under a
key and render it with `t()` or `tRich()`; the content files then hold keys
and the pages read the same as today in en-US.

The guide is built from 6529 AI's own install guides
(`docs/install/macos.md`, `windows.md`, `linux.md` and
`getting-started.md`) and fills in the newest release's file names, or
`<version>` while there is none. Its Windows step names the installer's
publisher when the feed gives one, and says SmartScreen warns when the
feed says it is unsigned. The known issues come from those guides' notes
on what was tested; update them, and `AI_KNOWN_ISSUES_UPDATED`, as 6529
AI is tested further.

The first release, release candidate 1 (`0.1.0-rc.1`), runs models on the
person's own computer only, and its app hides the 6529 AI network. So the
guide leaves out every network step (models from other providers, serving
to others, linking an account), and no page mentions the network. When a
release turns the network
on, add its steps from 6529 AI's `use-the-network.md`,
`serve-and-offer.md` and `link-account.md`, and its known issues.

## Link it from the site

When the owner has seen it: add the menu or page link, add the section to
the Help Bot corpus and the header search, and decide whether the pages
should be found by search engines (the `X-Robots-Tag` rule in
`config/nextConfig.ts`, the sitemap exclusions and each page's metadata).
