import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthAuthorizePageClient from "./page.client";

export default function AuthAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <AuthAuthorizePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Authorize Community App",
  });
}