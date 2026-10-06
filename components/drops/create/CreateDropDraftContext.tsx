"use client";

import { createContext } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";

/** Optional recovery and accessibility configuration for an embedded composer. */
export const CreateDropDraftContext = createContext<{
  readonly initialDrop: CreateDropConfig | null;
  readonly onChange: () => void;
  readonly label: string;
  readonly errorId: string;
  readonly invalid: boolean;
  readonly autoFocus: boolean;
} | null>(null);
