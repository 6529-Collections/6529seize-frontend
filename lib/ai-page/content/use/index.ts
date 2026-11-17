import { AI_USE_API } from "./api";
import { AI_USE_END } from "./end";
import { AI_USE_INSTALL } from "./install";
import { AI_USE_PAGE } from "./page";
import type { AiUseBlock, AiUseSection } from "./types";

export type { AiUseBlock } from "./types";

// How to use 6529 AI for real, from 6529 AI's own walk-through of release
// candidate 1 (its use.md): the install on each system, the page, the API
// and the command line, with real pictures and real command output. The
// walk-through's parts about the 6529 AI network are left out, as on the
// other pages. Text may hold **bold** for what the screen shows, *italic*,
// `code`, and [links](/ai). en-US only for now; see
// ops/docs/ai-download-page.md.

export const AI_USE_LEAD =
  "6529 AI runs open-weights AI models on your computer. This page takes you from the download to real use, one step at a time, with pictures of each step.";

export const AI_USE_INTRO: readonly AiUseBlock[] = [
  {
    kind: "p",
    text: "You chat with them, make images and turn speech into text in a page in your browser, and your own programs reach the same models through an OpenAI-compatible API on 127.0.0.1.",
  },
  {
    kind: "p",
    text: "Everything here is from `0.1.0-rc.1`, the first release candidate, with the config it installs. The pictures come from three computers:",
  },
  {
    kind: "table",
    head: ["Steps", "Computer"],
    rows: [
      [
        "The page, the models, the API",
        "Ubuntu 24.04 with an NVIDIA L4 GPU (24 GB) and 16 GB of memory, an AWS g6.xlarge",
      ],
      [
        "Installing on a Mac",
        "A Mac mini with an Apple M2 and 24 GB of memory, macOS 15.8.2, on AWS",
      ],
      ["Installing on Windows", "Windows Server 2025 on AWS, with no GPU"],
    ],
  },
  {
    kind: "p",
    text: "Your port, sizes and timings differ from these. Where a step shows a port, ours was 43188; use the one your install prints.",
  },
];

export const AI_USE_SECTIONS: readonly AiUseSection[] = [
  ...AI_USE_INSTALL,
  ...AI_USE_PAGE,
  ...AI_USE_API,
  ...AI_USE_END,
];
