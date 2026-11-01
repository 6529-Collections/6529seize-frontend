import type { ReactNode } from "react";

/** True when an optional slot has something to render. */
export const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== "";
