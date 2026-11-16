// What hasn't been tested yet in release candidate 1, from 6529 AI's
// install guides and their notes on what was tested. It runs models on the
// person's own computer only and hides the network, so nothing here is
// about the network. Text may hold **bold**, *italic* and `code`. en-US
// only for now; see ops/docs/ai-download-page.md.

import type { AiCode } from "./guide";

/** The day this list last changed, `YYYY-MM-DD`. */
export const AI_KNOWN_ISSUES_UPDATED = "2026-11-16";

export type AiKnownIssue = {
  /** The issue, in a line. */
  readonly issue: string;
  /** What to do about it, when there is something. */
  readonly workaround?: string | undefined;
  /** Commands or paths for the workaround, each with a copy button. */
  readonly code?: readonly AiCode[] | undefined;
};

export type AiKnownIssueGroup = {
  readonly key: "mac" | "windows" | "linux" | "everywhere";
  readonly title: string;
  readonly issues: readonly AiKnownIssue[];
};

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
      {
        issue:
          "Opening the app by double-click hasn't been tested; it was set up from Terminal.",
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
            code: "C:\\Program Files\\6529 AI\\6529-ai.toml",
          },
        ],
      },
      {
        issue:
          "Clicking through the installer's screens hasn't been tested; it was installed silently.",
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
          "Answering the install's question in a terminal hasn't been tested.",
        workaround: "Answer it before you install:",
        code: [
          {
            label: "Terminal",
            code: 'echo "6529-ai 6529-ai/placement select alone" | sudo debconf-set-selections',
          },
        ],
      },
    ],
  },
  {
    key: "everywhere",
    title: "On every system",
    issues: [
      {
        issue:
          "If the page doesn't open within 60 seconds of installing, the service didn't start.",
        workaround: "Its log says why:",
        code: [
          { label: "Mac, log file", code: "~/Library/Logs/6529-ai.log" },
          {
            label: "Windows, log file",
            code: "%LOCALAPPDATA%\\6529-ai\\logs\\6529-ai.log",
          },
          { label: "Linux, Terminal", code: "journalctl -u 6529-ai" },
        ],
      },
    ],
  },
];
