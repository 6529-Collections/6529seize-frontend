import { getAppMetadata } from "@/components/providers/metadata";
import { getNodeEnv } from "@/config/env";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AgentLoginClient from "./page.client";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function getHostnameFromHostHeader(hostHeader: string | null): string | null {
  const firstHost = hostHeader?.split(",")[0]?.trim().toLowerCase();
  if (!firstHost) {
    return null;
  }

  if (firstHost.startsWith("[")) {
    const closingBracketIndex = firstHost.indexOf("]");
    return closingBracketIndex > 1
      ? firstHost.slice(1, closingBracketIndex)
      : null;
  }

  return firstHost.split(":")[0] || null;
}

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".local");
}

function isDevLikeRuntime(): boolean {
  const nodeEnv = getNodeEnv();
  return nodeEnv === "development" || nodeEnv === "test" || nodeEnv === "local";
}

export default async function AgentLoginPage() {
  const headersList = await headers();
  const hostname = getHostnameFromHostHeader(
    headersList.get("host") ?? headersList.get("x-forwarded-host")
  );

  if (!hostname || !isLocalHostname(hostname) || !isDevLikeRuntime()) {
    notFound();
  }

  return <AgentLoginClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...getAppMetadata({
      title: "Agent Login",
      description: "Local agent login",
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}
