# Workstreams

This directory contains current operational state and a clearly separated
historical archive. Current workstreams must describe present repository and
GitHub reality; completed manager memory belongs under [`archive/`](archive/).

## Active workstreams

| Workstream | Current scope | Source of current status |
| --- | --- | --- |
| [Frontend i18n fallback debt](i18n-fallbacks/README.md) | Six source-verified locale fallback records that still have implementation work remaining | The individual debt records and current source |
| [Profile Native CMS](profile-native-cms-roadmap/README.md) | Feature-flagged runtime/builder foundation plus four open follow-up PRs | [`active-context.md`](profile-native-cms-roadmap/active-context.md), current source, and live GitHub state |

Live code, tests, configs, workflows, and GitHub state override workstream prose.
If an active file cannot be reconciled with those sources, update or archive it
before using it as execution guidance.

## Archive convention

Completed workstreams move to `archive/YYYY-MM/<workstream>/` with history-
preserving renames. Every archived Markdown file carries a notice that it is a
historical snapshot and non-authoritative.

Archive entries may retain merged/closed PR links, decisions, and validation
evidence. They must not be used as current branch, PR, release, security, or
next-action instructions. Machine-local paths, private operational details, and
credential material do not belong in either active or archived files.

Runtime-imported fixtures, schemas, or other live source inputs remain with the
active workstream even when the phase that introduced them is complete.

See the [archive index](archive/README.md) for completion evidence and
supersession notes.
