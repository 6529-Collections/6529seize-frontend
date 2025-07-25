"use client";

import AppWalletsComponent from "@/components/app-wallets/AppWallets";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";

export default function AppWallets() {
  useSetTitle("App Wallets | Tools");

  return (
    <main className={styles.main}>
      <AppWalletsComponent />
    </main>
  );
}
