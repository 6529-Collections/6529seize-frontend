"use client";

import { createContext } from "react";

/** Sheet headers provide dismissal; popovers need their own Cancel action. */
export const WaveSettingEditorContext = createContext<"popover" | "sheet">(
  "popover"
);
