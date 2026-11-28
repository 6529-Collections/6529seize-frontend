import type { Metadata } from "next";

import { CreateWork } from "@/components/stream-sepolia/CreateWork";

import { streamSepoliaMetadata } from "../metadata";

export default function StreamSepoliaCreateWorkPage() {
  return <CreateWork />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.create");
}
