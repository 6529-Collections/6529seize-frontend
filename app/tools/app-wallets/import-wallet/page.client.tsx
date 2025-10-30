"use client";

import AppWalletImport from "@/components/app-wallets/AppWalletImport";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";

export default function AppWalletImportPage() {
  useSetTitle("Import App Wallet | Tools");

  return (
    <main className={styles.main}>
      <AppWalletImport />
    </main>
  );
}
