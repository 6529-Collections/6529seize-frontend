"use client";

import AppWalletComponent from "@/components/app-wallets/AppWallet";
import { getAppMetadata } from "@/components/providers/metadata";
import { useTitle } from "@/contexts/TitleContext";
import { formatAddress } from "@/helpers/Helpers";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { useEffect } from "react";

export default function AppWalletPage(props: { readonly address: string }) {
  const { setTitle } = useTitle();

  const address = props.address;

  useEffect(() => {
    setTitle(`${formatAddress(address)} | App Wallets | 6529.io`);
  }, [setTitle]);

  return (
    <main className={styles.main}>
      <AppWalletComponent address={address} />
    </main>
  );
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
