// What is known about release candidate 1: the bugs found while using it,
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
    system: "windows",
    symptom:
      'On a fresh Windows, **Fetch and serve** fails for every model with "error sending request for url".',
    fix: "Open PowerShell as administrator and reach the two Let's Encrypt test sites, then restart the scheduled task **6529 AI**, or the computer. The next build fixes it.",
    code: [
      {
        label: "PowerShell, as administrator",
        code: `Invoke-WebRequest https://valid-isrgrootx1.letsencrypt.org -UseBasicParsing | Out-Null
Invoke-WebRequest https://valid-isrgrootx2.letsencrypt.org -UseBasicParsing | Out-Null
Stop-ScheduledTask -TaskName '6529 AI'
Start-ScheduledTask -TaskName '6529 AI'`,
      },
    ],
    cause:
      "Windows adds the root certificate of the model registry's address only when its own TLS first needs it, and 6529 AI reads the roots once, when it starts.",
  },
  {
    system: "windows",
    symptom:
      "On a computer with no GPU, the installer picks **On the GPU, through Vulkan**.",
    fix: "Nothing to do: the models still run, on the processor. To use the CPU engines instead, reinstall and choose **On the CPU only**.",
    cause:
      "The installer picks Vulkan whenever Windows has the Vulkan loader, which Windows Server 2025 has even without a GPU.",
  },
  {
    system: "everywhere",
    symptom:
      "A model about as big as the computer's memory can take many minutes to load from a slow disk.",
    fix: "Keep the models on a fast local disk, or pick a smaller model: from a local NVMe disk the same 15.6 GB model loaded in 70 seconds.",
    cause:
      "The engine maps the model's files into memory, and when the memory can't hold them all it reads the same parts from the disk again and again.",
  },
  {
    system: "everywhere",
    symptom:
      "A restart of the service, or of the computer, signs the page out, though its dialog says the sign-in lasts 7 days.",
    fix: "Make a new sign-in link: open **6529 AI** from Applications on a Mac or from the Start menu on Windows. On Linux:",
    code: [
      {
        label: "Linux, Terminal",
        code: "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print",
      },
    ],
    cause:
      "The sign-in lasts only as long as the running service, which the dialog doesn't say.",
  },
  {
    system: "everywhere",
    symptom:
      "In Chat, a long first message hides that chat's rename and delete buttons.",
    fix: "Start a chat with a short first message: it becomes the chat's name.",
    cause:
      "The chat list doesn't shorten a long name, so the name pushes the buttons out of sight.",
  },
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
