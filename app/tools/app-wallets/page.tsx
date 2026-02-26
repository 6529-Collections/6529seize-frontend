import { getAppMetadata } from "@/components/providers/metadata";

import AppWalletsClient from "./page.client";

import type { Metadata } from "next";

export default function AppWalletsPage() {
  return <AppWalletsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "App Wallets", description: "Tools" });
}
