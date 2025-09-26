import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import BlockPickerClient from "./page.client";

export default function BlockFinderPage() {
  return <BlockPickerClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Block Finder",
    description: "Tools",
  });
}
