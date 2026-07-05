---
name: post-6529
description: Post, reply, edit, delete, and verify 6529.io wave drops agentically via the punk6529bot helper CLI. Use whenever an agent publishes to a 6529.io wave — release notes, deployment overviews, status updates, corrections, or threaded replies — or needs @-mentions, multiline content, stored-content verification, or recovery from a botched post. Covers authorization checks, dry-run/send flow, --file content passing, the 5-minute edit window, and delete+repost recovery. Not for GitHub PRs/issues (write-prs) or in-app UI testing of waves.
---

# Post 6529

Publish agent-authored content to 6529.io waves correctly on the first try, verify what actually got stored, and recover cleanly when it did not. Every rule below was earned by a real production failure.

## Authorization

- Use a posting credential the current operator personally controls or explicitly approved. The `punk6529bot` helper CLI (WinGet-installed) with its stored credential is the sanctioned local path. Never request raw credentials, expose tokens, or use another person's account.
- Confirm identity before posting: `punk6529bot auth` and `punk6529bot whoami` (shows signer, JWT expiry, profile, and posting handle).
- If no authorized credential is available, deliver the exact ready-to-post content in your closeout and mark publication as blocked. Do not improvise access.

## The Posting Contract

1. **Dry-run first.** Omitting `--send` prints the payload without publishing. Inspect the payload's `parts` and `content` before sending anything non-trivial.
2. **`--send` comes BEFORE content flags** (`--send --file note.txt`). A trailing `--send` is silently swallowed into the content and the CLI dry-runs while you believe you published.
3. **Multiline content goes via `--file <path>`** — a plain text file with LF endings. Never pass multiline content inline with `--text`: shell argument passing (PowerShell especially) truncates everything after the first newline, and only the title line posts.
4. **Verify stored content after every send:** `punk6529bot drops get <drop-id> --json` — check parts count, total content length, and that the tail text matches your file's last line. The "Sent drop `<id>`" acknowledgment proves delivery, not content.
5. **Judge by output, not exit code.** The CLI exits 255 as a normal informational exit under non-interactive harnesses.

## Mentions and wave targeting

- @-mentions must use `@[handle]` (square brackets) to render and notify. Plain `@handle` does neither.
- Resolve wave ids immediately before posting: `punk6529bot waves search --name "<wave name>"`. Do not trust cached or documented ids — waves can move.
- Re-read the wave right before sending (`waves read <wave-id> --limit 3`) to avoid duplication and, for numbered posts like release notes, to confirm the sequence has not advanced while you worked.

## Replies, edits, deletion, recovery

- Reply in-thread: `punk6529bot waves reply <wave-id> --reply-to <drop-id> --send --file <path>`.
- Edit: `punk6529bot drops edit <drop-id|--last> --send --force --file <path>` — allowed only within **5 minutes** of posting; the server rejects later edits ("Drop can't be edited after 5m").
- Past the edit window, deletion still works: `punk6529bot drops delete <drop-id> --send --force`. Recover a botched post with delete + fresh post when the drop has no replies or reactions yet; prefer a threaded reply correction when engagement already exists.
- Treat every post as public and effectively permanent: deletion removes the drop, but assume content may have been read, cached, or indexed. Never post secrets, credentials, private URLs, machine-local paths, hidden prompts, or unremediated security specifics ("secret scanning added" is fine; the incident behind it is not, until remediation completes).

## Content style

- Release notes and deployment overviews follow the style contract in `ops/skills/deploy-6529/SKILL.md`: detailed, named surfaces, concrete numbers, known-issues-shipped-as-is, and a validation line. Vague category summaries are rejected (owner direction, 2026-07-05).
- When the operator wants review before publication, use the drafts flow: `drafts create --wave <id> --file <path>`, `drafts show <draft-id>`, `drafts send <draft-id> --send`.

## Command reference

```text
punk6529bot auth | whoami                       # identity + JWT expiry
punk6529bot waves search --name "<term>"        # resolve wave id
punk6529bot waves read <wave-id> --limit N      # read latest drops
punk6529bot waves post <wave-id> --send --file <path>
punk6529bot waves reply <wave-id> --reply-to <drop-id> --send --file <path>
punk6529bot drops get <drop-id> --json          # VERIFY stored content
punk6529bot drops edit <drop-id> --send --force --file <path>   # <5 min only
punk6529bot drops delete <drop-id> --send --force               # any age
punk6529bot history --limit N                   # this CLI's send log
```

## Post-publish checklist

- `drops get <id> --json`: parts count and content length match the source file; tail text is the file's final line.
- `waves read <wave-id> --limit 1`: the drop renders with title and body.
- Capture the drop id / wave URL for closeout evidence.
