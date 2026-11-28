import type { Metadata } from "next";

import { CreateWork } from "@/components/stream-sepolia/CreateWork";

import { streamSepoliaMetadata } from "../metadata";

export default async function StreamSepoliaCreateWorkPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ door?: string | string[] }>;
}) {
  // "?door=independent" opens the Independent Stream door (deploy, or create in your contract).
  const { door } = await searchParams;
  return <CreateWork initialDoor={door === "independent" ? "independent" : undefined} />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.create");
}
