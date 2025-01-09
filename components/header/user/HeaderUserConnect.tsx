import { useState } from "react";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import HeaderUserConnectAppWalletModal from "./app-wallets/HeaderUserConnectAppWalletModal";
import useCapacitor from "../../../hooks/useCapacitor";

export default function HeaderUserConnect(props: Readonly<{}>) {
  const { seizeConnect } = useSeizeConnectContext();
  const capacitor = useCapacitor();

  const [isAppWalletModalOpen, setIsAppWalletModalOpen] = useState(false);

  return (
    <div className="tw-flex tw-flex-row tw-flex-wrap tw-gap-3 tw-justify-center">
      {capacitor.isCapacitor && (
        <button
          onClick={() => setIsAppWalletModalOpen(true)}
          type="button"
          className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
          Connect{" "}
          <span className="tw-ml-2 tw-text-xs tw-font-normal text-muted">
            (App Wallet)
          </span>
        </button>
      )}
      <button
        onClick={() => seizeConnect()}
        type="button"
        className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
        Connect{" "}
        {capacitor.isCapacitor && (
          <span className="tw-ml-2 tw-text-xs tw-font-normal text-muted">
            (Web3Modal)
          </span>
        )}
      </button>
      <HeaderUserConnectAppWalletModal
        open={isAppWalletModalOpen}
        onClose={() => setIsAppWalletModalOpen(false)}
      />
    </div>
  );
}
