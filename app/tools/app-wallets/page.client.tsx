"use client";

import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const AppWalletsComponent = dynamic(
  () => import("@/components/app-wallets/AppWallets"),
  {
    ssr: false,
  }
);

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
