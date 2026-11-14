import type { Metadata } from "next";
import { Suspense } from "react";
import BrowserConnectorPage from "@/components/desktop/BrowserConnectorPage";
import { getAppMetadata } from "@/components/providers/metadata";

// Opened by 6529 Desktop in the system browser. The request travels in the
// query; the page validates it and signs nothing until the user asks.
export default function BrowserConnectorRoute() {
  return (
    <Suspense fallback={null}>
      <BrowserConnectorPage />
    </Suspense>
  );
}

export const metadata: Metadata = getAppMetadata(
  {
    title: "Sign in to 6529 Desktop",
    description: "Sign in to 6529 Desktop with a browser wallet.",
  },
  { robots: { index: false, follow: false } }
);
