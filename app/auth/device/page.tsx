import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthDevicePageClient from "./page.client";

export default function AuthDevicePage() {
  return (
    <Suspense fallback={null}>
      <AuthDevicePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Community App Authorization",
  });
}