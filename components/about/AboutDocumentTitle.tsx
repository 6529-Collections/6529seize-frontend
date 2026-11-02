"use client";

import { useSetTitle } from "@/contexts/TitleContext";

// Claims the document title through TitleContext. About itself is a Server
// Component, so this is the only client code a static section needs for it.
export default function AboutDocumentTitle({
  title,
}: {
  readonly title: string;
}) {
  useSetTitle(title);
  return null;
}
