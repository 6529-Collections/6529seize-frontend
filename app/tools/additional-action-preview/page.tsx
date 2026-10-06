import { getAppMetadata } from "@/components/providers/metadata";
import { getNodeEnv } from "@/config/env";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AdditionalActionPreview from "./page.client";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: "Additional Action — Current Component",
    description: "Local preview of the current Memes artwork form fields.",
  }),
  robots: { index: false, follow: false },
};

export default async function AdditionalActionPreviewPage() {
  if (getNodeEnv() !== "development") {
    notFound();
  }

  const host = (await headers()).get("host");
  if (!host) {
    notFound();
  }
  let parsedHost: URL;
  try {
    parsedHost = new URL(`http://${host}`);
  } catch {
    notFound();
  }
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(parsedHost.hostname) ||
    parsedHost.host !== host.toLowerCase()
  ) {
    notFound();
  }

  return <AdditionalActionPreview />;
}
