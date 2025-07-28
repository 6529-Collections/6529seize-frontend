import React from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ElementColumnsRedirectPage() {
  return (
    <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=/" />
      <p>
        You are being redirected to <a href="/">/</a>
      </p>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
