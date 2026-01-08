import { getAppMetadata } from "@/components/providers/metadata";
import { formatAddress } from "@/helpers/Helpers";
import type { Metadata } from "next";
import AppWalletPageClient from "./page.client";

export default async function AppWalletPage({
  params,
}: {
  readonly params: Promise<{ "app-wallet-address": string }>;
}) {
  const { "app-wallet-address": address } = await params;
  return <AppWalletPageClient address={address} />;
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ "app-wallet-address": string }>;
}): Promise<Metadata> {
  const { "app-wallet-address": address } = await params;
  return getAppMetadata({
    title: `${formatAddress(address)} | App Wallets`,
    description: "Tools",
  });
}
