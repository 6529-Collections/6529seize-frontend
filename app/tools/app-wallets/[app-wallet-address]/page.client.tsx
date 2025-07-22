"use client";

import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";
import { formatAddress } from "@/helpers/Helpers";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const AppWalletComponent = dynamic(
  () => import("@/components/app-wallets/AppWallet"),
  {
    ssr: false,
  }
);

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
  params: { "app-wallet-address": string };
}): Promise<Metadata> {
  const address = params["app-wallet-address"];
  return getAppMetadata({
    title: `${formatAddress(address)} | App Wallets`,
    description: "Tools",
  });
}
