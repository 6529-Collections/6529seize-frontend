// What is known about the test release: the bugs found while using it,
// each with its fix and its cause, and what hasn't been tested yet, by
// system. From 6529 AI's install guides, their notes on what was tested,
// and its walk-through of real use. It runs models on the person's own
// computer only and hides the network, so nothing here is about the
// network. Text may hold **bold**, *italic* and `code`. en-US only for
// now; see ops/docs/ai-download-page.md.

import type { AiCode } from "./guide";

/** The day this list last changed, `YYYY-MM-DD`. */
export const AI_KNOWN_ISSUES_UPDATED = "2026-11-17";

type AiSystemKey = "mac" | "windows" | "linux" | "everywhere";

/** A bug seen in real use: what you see, what to do, and why, in a line. */
type AiKnownBug = {
  readonly system: AiSystemKey;
  readonly symptom: string;
  readonly fix: string;
  /** Commands for the fix, each with a copy button. */
  readonly code?: readonly AiCode[] | undefined;
  readonly cause: string;
};

export const AI_KNOWN_BUGS: readonly AiKnownBug[] = [
  {
    system: "everywhere",
    symptom:
      "A model about as big as the computer's memory can take many minutes to load from a slow disk.",
    fix: "Keep the models on a fast local disk, or pick a smaller model: from a local NVMe disk the same 15.6 GB model loaded in 70 seconds.",
    cause:
      "The engine maps the model's files into memory, and when the memory can't hold them all it reads the same parts from the disk again and again.",
  },
];

/** The release that fixed the bugs below, and what it fixed. */
export const AI_FIXED_IN = "0.1.0-rc.2";

export const AI_FIXED_BUGS: readonly string[] = [
  'On a fresh Windows, **Fetch and serve** no longer fails with "error sending request for url".',
  "The Windows installer picks the GPU engines only when the computer has a graphics card.",
  "The sign-in to the page lasts through a restart of the service.",
  "A long chat title no longer hides **Rename** and **Delete**.",
  "A model's attempt to call a tool shows as a plain note in the chat.",
  "Chat models on a Mac start with a 16K context.",
];

export type AiKnownIssue = {
  /** The issue, in a line. */
  readonly issue: string;
  /** What to do about it, when there is something. */
  readonly workaround?: string | undefined;
  /** Commands or paths for the workaround, each with a copy button. */
  readonly code?: readonly AiCode[] | undefined;
};

export type AiKnownIssueGroup = {
  readonly key: AiSystemKey;
  readonly title: string;
  readonly issues: readonly AiKnownIssue[];
};

/** What hasn't been tested yet, by system. */
export const AI_KNOWN_ISSUES: readonly AiKnownIssueGroup[] = [
  {
    key: "mac",
    title: "Mac",
    issues: [
      { issue: "Tested only on a cloud Mac (M2, macOS 15.8.2)." },
      {
        issue:
          "Not tested on macOS before 15.8; it is built for 13.3 and later.",
      },
    ],
  },
  {
    key: "windows",
    title: "Windows",
    issues: [
      { issue: "Tested only on Windows Server 2025, not on Windows 10 or 11." },
      {
        issue: "Not tested with a GPU.",
        workaround:
          "If models don't start, reinstall and choose **On the CPU only**. If the uninstall leaves the config behind, delete it first:",
        code: [
          {
            label: "File to delete",
            code: String.raw`C:\Program Files\6529 AI\6529-ai.toml`,
          },
        ],
      },
      {
        issue:
          "Opening the installer by double-click in File Explorer, and SmartScreen's warning, haven't been tested; it was opened from PowerShell.",
      },
    ],
  },
  {
    key: "linux",
    title: "Linux",
    issues: [
      {
        issue: "Tested only on Ubuntu 22.04 and 24.04.",
        workaround:
          "On another distribution, the `.tar.gz` installs the same files.",
      },
      {
        issue:
          "The CUDA packages are tested only on an NVIDIA L4, not on other NVIDIA GPUs.",
      },
    ],
  },
  {
    key: "everywhere",
    title: "On every system",
    issues: [
      {
        issue:
          "The page on a phone hasn't been tested: it answers on 127.0.0.1 only, and the phone-width pictures on Use it are a desktop browser made narrow.",
      },
      { issue: "**Record**, on the Speech screen, hasn't been tested." },
      {
        issue:
          "If the page doesn't open within 60 seconds of installing, the service didn't start.",
        workaround: "Its log says why:",
        code: [
          { label: "Mac, log file", code: "~/Library/Logs/6529-ai.log" },
          {
            label: "Windows, log file",
            code: String.raw`%LOCALAPPDATA%\6529-ai\logs\6529-ai.log`,
          },
          { label: "Linux, Terminal", code: "journalctl -u 6529-ai" },
        ],
      },
    ],
  },
];
