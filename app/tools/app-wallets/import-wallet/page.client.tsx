"use client";

import AppWalletImport from "@/components/app-wallets/AppWalletImport";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.css";

export default function AppWalletImportPage() {
  useSetTitle("Import App Wallet | Tools");

  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <AppWalletImport />
    </main>
  );
}
