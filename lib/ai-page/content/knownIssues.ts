// What nobody has tried yet in release candidate 1, from 6529 AI's install
// guides and their notes on what was tested. It runs models on the
// person's own computer only and hides the network, so nothing here is
// about the network. Text may hold **bold** and `code`. en-US only for now;
// see ops/docs/ai-download-page.md.

import type { AiCode } from "./guide";

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
      {
        issue:
          "Tried only on a cloud Mac, an Apple M2 with macOS 15.8.2; never on a Mac on a desk.",
      },
      {
        issue:
          "Not tried on a macOS before 15.8, although it is built for 13.3 and later.",
      },
      {
        issue:
          "The release's app was set up from Terminal; nobody has opened it by hand yet.",
      },
    ],
  },
  {
    key: "windows",
    title: "Windows",
    issues: [
      {
        issue: "Tried only on Windows Server 2025, not on Windows 10 or 11.",
      },
      {
        issue: "Not tried with a GPU.",
        workaround:
          "If models don't start, reinstall and choose **On the CPU only**. If the uninstall leaves the config behind, delete it first:",
        code: [{ code: "C:\\Program Files\\6529 AI\\6529-ai.toml" }],
      },
      {
        issue:
          "The installer ran silently; nobody has clicked through its screens.",
      },
    ],
  },
  {
    key: "linux",
    title: "Linux",
    issues: [
      {
        issue:
          "Tried only on Ubuntu 22.04 and 24.04, not on another distribution.",
        workaround:
          "On another distribution, the `.tar.gz` installs the same files.",
      },
      {
        issue:
          "Nobody has answered the install's question in a terminal by hand.",
        workaround: "Answer it before you install:",
        code: [
          {
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
          "The page doesn't open within 60 seconds of installing: the service didn't start.",
        workaround: "Its log says why:",
        code: [
          { label: "Mac", code: "~/Library/Logs/6529-ai.log" },
          {
            label: "Windows",
            code: "%LOCALAPPDATA%\\6529-ai\\logs\\6529-ai.log",
          },
          { label: "Linux", code: "journalctl -u 6529-ai" },
        ],
      },
    ],
  },
];
