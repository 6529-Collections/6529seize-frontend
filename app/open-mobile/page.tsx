import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import OpenMobilePageClient from "./page.client";

export default function OpenMobilePage() {
  return (
    <Suspense fallback={null}>
      <OpenMobilePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Open Mobile" });
}
