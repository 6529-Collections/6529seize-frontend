"use client";

import AppWalletImport from "@/components/app-wallets/AppWalletImport";
import { DELEGATION_PAGE_MAIN_CLASS_NAME } from "@/components/delegation/delegation-ui";
import { useSetTitle } from "@/contexts/TitleContext";

export default function AppWalletImportPage() {
  useSetTitle("Import App Wallet | Tools");

  return (
    <main className={DELEGATION_PAGE_MAIN_CLASS_NAME}>
      <AppWalletImport />
    </main>
  );
}
