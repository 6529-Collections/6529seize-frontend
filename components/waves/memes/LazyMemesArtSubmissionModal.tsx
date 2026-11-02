"use client";

import type { ComponentProps } from "react";

import { createLazyDialog } from "@/components/utils/lazy-load/createLazyDialog";

import type MemesArtSubmissionModalComponent from "./MemesArtSubmissionModal";

// The Memes submission flow opens only on request, so wave and competition
// pages fetch its chunk on the first open instead of with the page.
const memesArtSubmissionModal = createLazyDialog<
  ComponentProps<typeof MemesArtSubmissionModalComponent>
>(() => import("./MemesArtSubmissionModal"));

export const preloadMemesArtSubmissionModal = memesArtSubmissionModal.preload;

export default memesArtSubmissionModal.Dialog;
