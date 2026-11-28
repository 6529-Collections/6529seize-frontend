import type { Metadata } from "next";

import { ContractPage } from "@/components/stream-sepolia/ContractPage";

import { streamSepoliaMetadata } from "../metadata";

export default function StreamSepoliaContractPage() {
  return <ContractPage />;
}

export function generateMetadata(): Metadata {
  return streamSepoliaMetadata("streamSepolia.meta.contract");
}
