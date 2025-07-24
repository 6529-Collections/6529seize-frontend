import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import AppWalletsClient from "./page.client";

export default function AppWalletsPage() {
  return <AppWalletsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "App Wallets", description: "Tools" });
}
