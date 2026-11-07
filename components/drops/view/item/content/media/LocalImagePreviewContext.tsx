"use client";

import { createContext, useContext } from "react";

// Only a locally constructed submission preview or decrypted attachment provides
// this URL. Published drops keep the bounded CDN/proxy path.
export const LocalImagePreviewContext = createContext<string | null>(null);

export function useLocalImagePreviewSource(src: string): string | null {
  const localSource = useContext(LocalImagePreviewContext);
  return localSource === src &&
    (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,/i.test(src) ||
      src.startsWith("blob:"))
    ? src
    : null;
}
