"use client";

import type { CSSProperties } from "react";

export const SIDEBAR_TOOLTIP_BORDER = "1px solid #4C4C55" as const;
export const SIDEBAR_TOOLTIP_STYLE = {
  padding: "6px 10px",
  background: "#37373E",
  color: "white",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
} as const satisfies CSSProperties;
