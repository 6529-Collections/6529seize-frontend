import type { Metadata } from "next";

import { HowItWorks } from "@/components/stream-sepolia/HowItWorks";

import { streamSepoliaMetadata } from "../metadata";

export default function StreamSepoliaHowItWorksPage() {
  return <HowItWorks />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.howItWorks");
}
