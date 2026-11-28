import type { Metadata } from "next";

import { WorkPage } from "@/components/stream-sepolia/WorkPage";

import { streamSepoliaMetadata } from "../../../metadata";

export default async function StreamSepoliaWorkPage({
  params,
}: {
  readonly params: Promise<{ token: string; tokenId: string }>;
}) {
  const { token, tokenId } = await params;
  return <WorkPage token={token} tokenId={tokenId} />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.work");
}
