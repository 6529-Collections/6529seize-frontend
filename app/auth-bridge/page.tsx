import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthBridgePageClient from "./page.client";

export default function AuthBridgePage() {
  return (
    <Suspense fallback={null}>
      <AuthBridgePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Auth Bridge" });
}