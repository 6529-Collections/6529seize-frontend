import AppWalletPageClient, { generateMetadata } from './page.client';

export default function AppWalletPage({ params }: { params: { "app-wallet-address": string } }) {
  const address = params["app-wallet-address"];
  return <AppWalletPageClient address={address} />;
}

export { generateMetadata };
