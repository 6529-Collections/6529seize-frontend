import type { Metadata } from "next";

import { CollectionPage } from "@/components/stream-sepolia/CollectionPage";

import { streamSepoliaMetadata } from "../metadata";

export default function StreamSepoliaCollectionPage() {
  return <CollectionPage />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.collection");
}
