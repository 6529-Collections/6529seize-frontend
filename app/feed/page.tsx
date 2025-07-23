import React from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function FeedRedirectPage() {
  return (
    <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=index.xml" />
      <p>
        You are being redirected to <a href="index.xml">index.xml</a>
      </p>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
