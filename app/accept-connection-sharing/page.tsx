import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import AcceptConnectionSharingPageClient from "./page.client";

export default function AcceptConnectionSharingPage() {
  return (
    <Suspense fallback={null}>
      <AcceptConnectionSharingPageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Accept Connection Sharing" });
}
