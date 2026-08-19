"use client";

import AppWalletsComponent from "@/components/app-wallets/AppWallets";
import { DELEGATION_PAGE_MAIN_CLASS_NAME } from "@/components/delegation/delegation-ui";
import { useSetTitle } from "@/contexts/TitleContext";

export default function AppWallets() {
  useSetTitle("App Wallets | Tools");

  return (
    <main className={DELEGATION_PAGE_MAIN_CLASS_NAME}>
      <AppWalletsComponent />
    </main>
  );
}
