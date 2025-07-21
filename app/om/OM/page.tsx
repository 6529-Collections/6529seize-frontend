import React from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const IndexPage = () => (
  <div>
    <title>Redirecting...</title>
    <meta httpEquiv="refresh" content="0;url=/om/" />
    <p>
      You are being redirected to <a href="/om/">/om/</a>
    </p>
  </div>
);

export default IndexPage;

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting" });
}
