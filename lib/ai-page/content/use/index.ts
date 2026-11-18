import { AI_USE_API } from "./api";
import { p } from "./blocks";
import { AI_USE_END } from "./end";
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
  "6529 AI runs open-weights AI models on your computer. Once it is installed, this page takes you through real use, one step at a time, with a picture of each step.";

export const AI_USE_INTRO: readonly AiUseBlock[] = [
  p(
    "You chat with the models, make images and turn speech into text in a page in your browser, and your own programs reach the same models through an OpenAI-compatible API on 127.0.0.1. Not installed yet? The [Guide](/ai/guide) installs it on a Mac, Windows or Linux."
  ),
  p(
    "Your port, sizes and timings will differ from the ones here. Where a step shows a port, ours was 43188; use the one your install prints."
  ),
];

/** Where the pictures and output come from, under the last section. */
export const AI_USE_FOOTNOTE =
  "The pictures and output come from three computers, each with the config its install writes: the page, the models and the API on Ubuntu 24.04 with an NVIDIA L4 (24 GB) and 16 GB of memory; the Mac's chat on an Apple M2 with 24 GB; the Windows uninstall on Windows Server 2025 with no GPU.";

export const AI_USE_SECTIONS: readonly AiUseSection[] = [
  ...AI_USE_PAGE,
  ...AI_USE_API,
  ...AI_USE_END,
];
