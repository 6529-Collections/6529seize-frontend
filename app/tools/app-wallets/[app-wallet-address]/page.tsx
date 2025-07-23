import AppWalletPageClient, { generateMetadata } from "./page.client";

export default async function AppWalletPage({
  params,
}: {
  readonly params: Promise<{ "app-wallet-address": string }>;
}) {
  const { "app-wallet-address": address } = await params;
  return <AppWalletPageClient address={address} />;
}

export { generateMetadata };
