import { getAppMetadata } from "@/components/providers/metadata";

import BlockPickerClient from "./page.client";

import type { Metadata } from "next";

export default function BlockFinderPage() {
  return <BlockPickerClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Block Finder",
    description: "Tools",
  });
}
