"use client";

import useInteractionMode from "@/src/interaction/useInteractionMode";

/** @deprecated Use useInteractionMode().enableLongPress instead. */
export default function useIsTouchDevice(): boolean {
  const { enableLongPress } = useInteractionMode();
  return enableLongPress;
}
