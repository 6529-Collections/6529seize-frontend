"use client";

import type { ComponentProps } from "react";

import { createLazyDialog } from "@/components/utils/lazy-load/createLazyDialog";

import type CreateWaveModalComponent from "./CreateWaveModal";

// The create-wave flow opens only on request, so wave and message pages fetch
// its chunk on the first open instead of with the page.
const createWaveModal = createLazyDialog<
  ComponentProps<typeof CreateWaveModalComponent>
>(() => import("./CreateWaveModal"));

export default createWaveModal.Dialog;
