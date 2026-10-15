"use client";

import { useSetTitle } from "@/contexts/TitleContext";

/** Sets the app shell's title from a Server Component page. */
export default function TdhPageTitle({ title }: { readonly title: string }) {
  useSetTitle(title);
  return null;
}
