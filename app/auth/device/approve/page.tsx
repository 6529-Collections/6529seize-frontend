import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthDeviceApprovePageClient from "./page.client";

export default function AuthDeviceApprovePage() {
  return (
    <Suspense fallback={null}>
      <AuthDeviceApprovePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Approve Community App",
  });
}