"use client";

import Button from "@/components/utils/button/Button";
import DotLoader from "../dotLoader/DotLoader";
import AppWalletCard from "./AppWalletCard";
import { CreateAppWalletModal } from "./AppWalletModal";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAppWallets } from "./AppWalletsContext";
import AppWalletsUnsupported from "./AppWalletsUnsupported";

export default function AppWallets() {
  const { appWalletsSupported, fetchingAppWallets, appWallets } =
    useAppWallets();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);

  function printWallets() {
    if (fetchingAppWallets) {
      return (
        <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
          Fetching wallets <DotLoader />
        </div>
      );
    }

    if (appWallets.length === 0) {
      return (
        <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
          No wallets found
        </div>
      );
    }

    return appWallets.map((w) => (
      <div
        key={w.address}
        className="tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3 tw-pb-3 min-[576px]:tw-w-1/2 min-[768px]:tw-w-1/3"
      >
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
        <div className="-tw-mx-3 tw-mt-4 tw-flex tw-flex-wrap">
          {printWallets()}
        </div>
        <div className="-tw-mx-3 tw-mt-4 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-items-center tw-gap-3 tw-px-3">
            <CreateAppWalletModal
              show={showCreateModal}
              onHide={() => setShowCreateModal(false)}
            />
            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              variant="action"
              size="md"
            >
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Create Wallet
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/tools/app-wallets/import-wallet")}
              variant="success"
              size="md"
            >
              <FontAwesomeIcon icon={faPlusCircle} height={16} /> Import Wallet
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-4 tw-pt-4 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <h1 className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
          App Wallets
        </h1>
      </div>
      {printContent()}
    </div>
  );
}
