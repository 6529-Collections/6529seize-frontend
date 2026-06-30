"use client";

import DotLoader from "../dotLoader/DotLoader";
import AppWalletCard from "./AppWalletCard";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAppWallets } from "./AppWalletsContext";
import AppWalletsUnsupported from "./AppWalletsUnsupported";
import {
  appWalletButtonClassName,
  appWalletColClassName,
  appWalletContainerClassName,
  appWalletRowClassName,
  appWalletWalletCardColClassName,
} from "./app-wallet-tailwind-classes";

export default function AppWallets() {
  const { appWalletsSupported, fetchingAppWallets, appWallets } =
    useAppWallets();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);

  function printWallets() {
    if (fetchingAppWallets) {
      return (
        <div className={appWalletColClassName}>
          Fetching wallets <DotLoader />
        </div>
      );
    }

    if (appWallets.length === 0) {
      return <div className={appWalletColClassName}>No wallets found</div>;
    }

    return appWallets.map((w) => (
      <div
        key={w.address}
        className={`${appWalletWalletCardColClassName} tw-pb-3`}>
        <AppWalletCard wallet={w} />
      </div>
    ));
  }

  function printContent() {
    if (!appWalletsSupported) {
      return <AppWalletsUnsupported />;
    }

    return (
      <>
        <div className={`${appWalletRowClassName} tw-mt-4`}>
          {printWallets()}
        </div>
        <div className={`${appWalletRowClassName} tw-mt-4`}>
          <div
            className={`${appWalletColClassName} tw-flex tw-items-center tw-gap-3`}>
            <CreateAppWalletModal
              show={showCreateModal}
              onHide={() => setShowCreateModal(false)}
            />
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className={appWalletButtonClassName(
                "primary",
                "tw-gap-2"
              )}>
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Create Wallet
            </button>
            <button
              type="button"
              onClick={() => router.push("/tools/app-wallets/import-wallet")}
              className={appWalletButtonClassName(
                "success",
                "tw-gap-2"
              )}>
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`${appWalletContainerClassName} tw-pb-4 tw-pt-4`}>
      <div className={appWalletRowClassName}>
        <h1 className={appWalletColClassName}>
          App Wallets
        </h1>
      </div>
      {printContent()}
    </div>
  );
}
