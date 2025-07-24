"use client";

import AppWalletsComponent from "@/components/app-wallets/AppWallets";
import { getAppMetadata } from "@/components/providers/metadata";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function AppWallets() {
  useSetTitle("App Wallets | Tools");

  return (
    <main className={styles.main}>
      <AppWalletsComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "App Wallets", description: "Tools" });
}
