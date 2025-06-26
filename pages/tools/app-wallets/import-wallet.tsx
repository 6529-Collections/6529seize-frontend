import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import React from "react";
import { useSetTitle } from "../../../contexts/TitleContext";

const AppWalletImport = dynamic(
  () => import("../../../components/app-wallets/AppWalletImport"),
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

AppWalletImportPage.metadata = {
  title: "App Wallets | Import",
  description: "Tools",
};
