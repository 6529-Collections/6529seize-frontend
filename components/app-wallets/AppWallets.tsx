"use client";

import DotLoader from "../dotLoader/DotLoader";
import AppWalletCard from "./AppWalletCard";
import AppWalletActionButton from "./AppWalletActionButton";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppWallets } from "./AppWalletsContext";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_PAGE_CONTAINER_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
} from "@/components/delegation/delegation-ui";

export default function AppWallets() {
  const { appWalletsSupported, fetchingAppWallets, appWallets } =
    useAppWallets();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);

  function printWallets() {
    if (fetchingAppWallets) {
      return (
        <div
          className={`${DELEGATION_CARD_CLASS_NAME} tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-p-5 tw-text-sm tw-text-iron-400`}
        >
          Fetching wallets <DotLoader />
        </div>
      );
    }

    if (appWallets.length === 0) {
      return (
        <div
          className={`${DELEGATION_CARD_CLASS_NAME} tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-p-5 tw-text-sm tw-text-iron-400`}
        >
          No wallets found
        </div>
      );
    }

    return appWallets.map((wallet) => (
      <AppWalletCard key={wallet.address} wallet={wallet} />
    ));
  }

  function printContent() {
    if (!appWalletsSupported) {
      return <AppWalletsUnsupported />;
    }

    return (
      <>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-flex sm:tw-items-center sm:tw-gap-3">
          <CreateAppWalletModal
            show={showCreateModal}
            onHide={() => setShowCreateModal(false)}
          />
          <AppWalletActionButton
            action="create"
            onClick={() => setShowCreateModal(true)}
            className="sm:tw-w-auto"
          >
            Create Wallet
          </AppWalletActionButton>
          <AppWalletActionButton
            action="import"
            onClick={() => router.push("/tools/app-wallets/import-wallet")}
            className="sm:tw-w-auto"
          >
            Import Wallet
          </AppWalletActionButton>
        </div>
        <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          {printWallets()}
        </div>
      </>
    );
  }

  return (
    <div className={DELEGATION_PAGE_CONTAINER_CLASS_NAME}>
      <header className="tw-mb-6">
        <h1 className={DELEGATION_PAGE_TITLE_CLASS_NAME}>App Wallets</h1>
      </header>
      {printContent()}
    </div>
  );
}
