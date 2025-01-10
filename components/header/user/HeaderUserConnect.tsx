import { useState } from "react";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import HeaderUserConnectAppWalletModal from "./app-wallets/HeaderUserConnectAppWalletModal";
import useCapacitor from "../../../hooks/useCapacitor";
import useAppWallets from "../../../hooks/useAppWallets";

export default function HeaderUserConnect(props: Readonly<{}>) {
  const { seizeConnect } = useSeizeConnectContext();
  const { appWalletsSupported } = useAppWallets();
  const [isAppWalletModalOpen, setIsAppWalletModalOpen] = useState(false);

  return (
    <div className="tw-flex tw-flex-row tw-flex-wrap tw-gap-3 tw-justify-center">
      {appWalletsSupported && (
        <button
          onClick={() => setIsAppWalletModalOpen(true)}
          type="button"
          className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
          Connect App Wallet
        </button>
      )}
      <button
        onClick={() => seizeConnect()}
        type="button"
        className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
        Connect {appWalletsSupported && "External Wallet"}
      </button>
      <HeaderUserConnectAppWalletModal
        open={isAppWalletModalOpen}
        onClose={() => setIsAppWalletModalOpen(false)}
      />
    </div>
  );
}
