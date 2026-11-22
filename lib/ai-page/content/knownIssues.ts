// What is known about the test release: the bugs and limits known so far,
// each with its fix and its cause, and what hasn't been tested yet, by
// system. From 6529 AI's install guides, their notes on what was tested,
// its notes on updates, and its walk-through of real use. It runs
// models on the person's own computer only and hides the network, so
// nothing here is about the network. Text may hold **bold**, *italic*,
// `code` and [links](/path). en-US only for now; see
// ops/docs/ai-download-page.md.

import type { AiCode } from "./guide";

/** The day this list last changed, `YYYY-MM-DD`. */
export const AI_KNOWN_ISSUES_UPDATED = "2026-11-22";

type AiSystemKey = "mac" | "windows" | "linux" | "everywhere";

/** A bug or limit: what you see, what to do, and why, in a line. */
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
      "`nemotron-3-nano-omni-30b` can't run: its row under **Models** says **Can't run here**.",
    fix: "Choose another model. The row says so before anything downloads.",
    cause:
      "llama.cpp b12110, the version in this release, stops with an error each time it sets up the model's image and audio encoder.",
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
    symptom: "0.1.0-rc.1 and 0.1.0-rc.2 don't update themselves.",
    fix: "[Download the newest release](/ai) and install it over the old one, once. It updates itself from then on.",
    cause: "Automatic updates came in 0.1.0-rc.3.",
  },
  {
    system: "mac",
    symptom: "On a standard account, the Mac app doesn't update itself.",
    fix: "Install each new release from the [download page](/ai), with an administrator's name and password.",
    cause:
      "The updater runs as you, so it can replace the app in Applications only where your account may.",
  },
  {
    system: "windows",
    symptom:
      "Installed anywhere but its own folder in Program Files, 6529 AI doesn't update itself.",
    fix: "Uninstall it and keep your models when it asks. Then install it again, and keep the folder the installer suggests.",
    cause:
      "The installer sets up the updater only when 6529 AI is in its own folder.",
  },
  {
    system: "linux",
    symptom: "A `.tar.gz` install doesn't update itself.",
    fix: "Install each new release's `.tar.gz` over it, as under **Another distribution** in the [guide](/ai/guide).",
    cause: "Only the `.deb` carries the updater.",
  },
  {
    system: "linux",
    symptom:
      "On an ARM64 computer with an NVIDIA GPU, such as a DGX Spark, the ARM64 `.deb` of 0.1.0-rc.3 updates itself to the package without CUDA, so models still run on the processor.",
    fix: "Install the ARM64 CUDA package, `6529-ai-cuda`, by hand from the [download page](/ai). apt removes `6529-ai` as it installs it.",
    cause:
      "Each `.deb` updates from a file of its own package, and 0.1.0-rc.3 had no CUDA package for ARM64.",
  },
];

/** The release that fixed the bugs below, and what it fixed. */
export const AI_FIXED_IN = "0.1.0-rc.3";

export const AI_FIXED_BUGS: readonly string[] = [
  "The download progress on the Provider page no longer freezes while the page is hidden.",
  "Models served together that don't fit in memory say so, instead of **Restarting**.",
  "A model that keeps restarting shows why its engine stopped.",
  "On a Mac with 12 GB of memory or less, chat models start with a 4K context, and the page suggests smaller models.",
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
      { issue: "Tested only on a cloud Mac (M1, macOS 15.8.3)." },
      {
        issue:
          "Not tested on macOS before 15.8; it is built for 13.3 and later.",
      },
      {
        issue:
          "Opening this release from Applications the first time hasn't been tested: it was set up from Terminal. An earlier build, opened that way, asked its question and opened the page signed in.",
        workaround:
          "If the first open doesn't set it up, run this in Terminal while logged in at the Mac's screen:",
        code: [
          {
            label: "Terminal",
            code: '"/Applications/6529 AI.app/Contents/MacOS/6529-ai-app" alone',
          },
        ],
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
          "The installer's screens haven't been tested: it was run silently.",
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
          "The x86-64 CUDA packages are tested only on an NVIDIA L4, and the ARM64 ones only on an NVIDIA T4G. Nobody has run them on a DGX Spark.",
      },
      {
        issue:
          "Sessions have run only on Ubuntu, and not from the CUDA packages.",
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
          "**Models from other companies**, in Settings, are tested only with a stand-in for each company's API. Nobody has used a real key from OpenAI, Anthropic or Google.",
      },
      {
        issue:
          "Sharing models over IPFS hasn't been tested behind a home router.",
      },
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
