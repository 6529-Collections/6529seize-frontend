import type { Metadata } from "next";

import { MyActivity } from "@/components/stream-sepolia/MyActivity";

import { streamSepoliaMetadata } from "../metadata";

export default function StreamSepoliaMyActivityPage() {
  return <MyActivity />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.me");
}
