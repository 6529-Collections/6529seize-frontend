"use client";

import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import React from "react";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const AppWalletImport = dynamic(
  () => import("@/components/app-wallets/AppWalletImport"),
  {
    ssr: false,
  }
);

export default function AppWalletImportPage(props: any) {
  useSetTitle("Import App Wallet | Tools");

  return (
    <main className={styles.main}>
      <AppWalletImport />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "App Wallets | Import", description: "Tools" });
}
