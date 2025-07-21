import React from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function GMRedirectPage() {
  return (
    <div>
      <title>Redirecting...</title>
      <meta
        httpEquiv="refresh"
        content="0;url=https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4"
      />
      <p>
        You are being redirected to{" "}
        <a href="https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4">
          https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4
        </a>
      </p>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
