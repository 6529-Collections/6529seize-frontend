import OpenMobilePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

function OpenMobileFallback() {
  return (
    <div className="tailwind-scope tw-flex tw-h-screen tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-text-center">
      <p className="tw-text-2xl tw-font-bold">Opening 6529 Mobile...</p>
    </div>
  );
}

export default function OpenMobilePage() {
  return (
    <Suspense fallback={<OpenMobileFallback />}>
      <OpenMobilePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Open Mobile" });
}
