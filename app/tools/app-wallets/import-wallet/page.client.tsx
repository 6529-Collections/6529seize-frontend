"use client";

import AppWalletImport from "@/components/app-wallets/AppWalletImport";
import { getAppMetadata } from "@/components/providers/metadata";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function AppWalletImportPage(props: any) {
  useSetTitle("Import App Wallet | Tools");

  return (
    <main className={styles.main}>
      <AppWalletImport />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "App Wallets | Import",
    description: "Tools",
  });
}
