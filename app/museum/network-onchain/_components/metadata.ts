import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";

/** Every page of the preview is kept out of search engines. */
export function onchainMuseumMetadata(
  title: string,
  description: string
): Metadata {
  return getAppMetadata(
    { title, description },
    { robots: { index: false, follow: false } }
  );
}
