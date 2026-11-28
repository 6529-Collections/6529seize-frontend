import type { Metadata } from "next";

import { StreamHome } from "@/components/stream-sepolia/StreamHome";

import { streamSepoliaMetadata } from "./metadata";

export default function StreamSepoliaHomePage() {
  return <StreamHome />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.home");
}
