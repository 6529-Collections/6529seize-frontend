"use client";

import { createContext, type ReactNode } from "react";

/** Private composers provide a preloaded catalog without public emoji lookups. */
export const ComposerEmojiContext = createContext<{
  readonly render: (id: string) => ReactNode;
  readonly isValid: (id: string) => boolean;
} | null>(null);
