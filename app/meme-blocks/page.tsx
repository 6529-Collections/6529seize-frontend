import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import BlockPickerClient from "./page.client";

export default function MemeBlocksPage() {
  return <BlockPickerClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Blocks",
    description: "Tools",
  });
}
