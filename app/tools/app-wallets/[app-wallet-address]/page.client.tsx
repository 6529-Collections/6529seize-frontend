"use client";

import { useEffect } from "react";

import AppWalletComponent from "@/components/app-wallets/AppWallet";
import { useTitle } from "@/contexts/TitleContext";
import { formatAddress } from "@/helpers/Helpers";
import styles from "@/styles/Home.module.scss";

export default function AppWalletPage(props: { readonly address: string }) {
  const { setTitle } = useTitle();

  const address = props.address;

  useEffect(() => {
    setTitle(`${formatAddress(address)} | App Wallets | 6529.io`);
  }, [address, setTitle]);

  return (
    <main className={styles["main"]}>
      <AppWalletComponent address={address} />
    </main>
  );
}
