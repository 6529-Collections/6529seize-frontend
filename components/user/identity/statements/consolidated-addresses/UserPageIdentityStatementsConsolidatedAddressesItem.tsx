"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { getTransactionLink } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import UserPageIdentityStatementsConsolidatedAddressesItemPrimary from "./UserPageIdentityStatementsConsolidatedAddressesItemPrimary";

export default function UserPageIdentityStatementsConsolidatedAddressesItem({
  address,
  primaryAddress,
  canEdit,
  isOpen,
  onToggleOpen,
}: {
  readonly address: ApiWallet;
  readonly primaryAddress: string | null;
  readonly canEdit: boolean;
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
}) {
  const { setToast } = useAuth();

  const goToOpensea = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    window.open(`https://opensea.io/${address.wallet}`, "_blank");
  };

  const goToEtherscan = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    window.open(`https://etherscan.io/address/${address.wallet}`, "_blank");
  };

  const isPrimary =
    address.wallet.toLowerCase() === primaryAddress?.toLowerCase();

  const [copiedItem, setCopiedItem] = useState<"full-address" | "ens" | null>(
    null
  );
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopyAddress = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    copyToClipboard(address.wallet);
    setCopiedItem("full-address");
    setTimeout(() => {
      setCopiedItem((current) => (current === "full-address" ? null : current));
    }, 1000);
  };

  const handleCopyEns = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!address.display) {
      return;
    }

    event.stopPropagation();
    copyToClipboard(address.display);
    setCopiedItem("ens");
    setTimeout(() => {
      setCopiedItem((current) => (current === "ens" ? null : current));
    }, 1000);
  };

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const [assigningPrimary, setAssigningPrimary] = useState(false);
  const [statusMessage, setStatusMessage] = useState<any>();

  const writeDelegation = useWriteContract();

  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });

  function getError(e: any) {
    return e.message.split("Request Arguments")[0];
  }

  useEffect(() => {
    if (writeDelegation.isPending) {
      setStatusMessage("Confirm in your wallet...");
    } else if (writeDelegation.data) {
      let trxLink = (
        <>
          {writeDelegation.data && (
            <a
              href={getTransactionLink(
                DELEGATION_CONTRACT.chain_id,
                writeDelegation.data
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-primary-400 tw-underline"
            >
              View Transaction
            </a>
          )}
        </>
      );
      if (waitWriteDelegation.isLoading) {
        setStatusMessage(<>Waiting for confirmation... {trxLink}</>);
      } else if (waitWriteDelegation.data) {
        setStatusMessage(
          <>
            Confirmed! Check back in a few minutes to see the change. {trxLink}
          </>
        );
        setToast({
          type: "success",
          message: "Primary address set successfully",
        });
      } else if (waitWriteDelegation.error) {
        setStatusMessage(
          <>
            Error: {getError(waitWriteDelegation.error)} {trxLink}
          </>
        );
        setToast({
          type: "error",
          message: `Error setting primary address: ${getError(
            waitWriteDelegation.error
          )}`,
        });
      }
    } else {
      setStatusMessage(undefined);
    }
  }, [writeDelegation.status, waitWriteDelegation.status]);

  const assignPrimary = async () => {
    setAssigningPrimary(true);
    writeDelegation.writeContract({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [
        DELEGATION_ALL_ADDRESS,
        address.wallet,
        NEVER_DATE,
        PRIMARY_ADDRESS_USE_CASE.use_case,
        true,
        0,
      ],
    });
  };

  return (
    <li>
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/40">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-px-3 tw-py-2">
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-1">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`consolidated-address-panel-${address.wallet}`}
                onClick={onToggleOpen}
                className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-font-mono tw-text-xs tw-font-normal tw-leading-none tw-text-iron-100 hover:tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400"
              >
                {address.wallet.slice(0, 6)}
              </button>
              <UserPageIdentityStatementsConsolidatedAddressesItemPrimary
                isPrimary={isPrimary}
                canEdit={canEdit}
                assignPrimary={assignPrimary}
                isAssigningPrimary={assigningPrimary}
              />
            </div>
            {address.display && (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`consolidated-address-panel-${address.wallet}`}
                onClick={onToggleOpen}
                className="tw-mt-1 tw-max-w-full tw-truncate tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-font-mono tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100 hover:tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400"
              >
                {address.display}
              </button>
            )}
          </div>
          <div className="tw-ml-auto tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5">
            <button
              type="button"
              onClick={goToEtherscan}
              aria-label="Go to Etherscan"
              className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0.5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-200"
              data-tooltip-id={`etherscan-tooltip-${address.wallet}`}
              data-tooltip-content={isTouchScreen ? null : "Etherscan"}
            >
              <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center">
                <EtherscanIcon />
              </div>
            </button>
            {!isTouchScreen && (
              <Tooltip
                id={`etherscan-tooltip-${address.wallet}`}
                place="top"
                positionStrategy="fixed"
                offset={8}
                opacity={1}
                style={TOOLTIP_STYLES}
              />
            )}
            <button
              type="button"
              onClick={goToOpensea}
              aria-label="Go to Opensea"
              className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0.5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-200"
              data-tooltip-id={`opensea-tooltip-${address.wallet}`}
              data-tooltip-content={isTouchScreen ? null : "Opensea"}
            >
              <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center">
                <OpenseaIcon />
              </div>
            </button>
            {!isTouchScreen && (
              <Tooltip
                id={`opensea-tooltip-${address.wallet}`}
                place="top"
                positionStrategy="fixed"
                offset={8}
                opacity={1}
                style={TOOLTIP_STYLES}
              />
            )}
            <button
              type="button"
              aria-label={
                isOpen
                  ? "Collapse consolidated address details"
                  : "Expand consolidated address details"
              }
              aria-expanded={isOpen}
              aria-controls={`consolidated-address-panel-${address.wallet}`}
              onClick={onToggleOpen}
              className="tw-border-0 tw-bg-transparent tw-p-0.5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400"
            >
              <ChevronDownIcon
                className={`tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-out ${
                  isOpen ? "tw-rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div
            id={`consolidated-address-panel-${address.wallet}`}
            className="tw-border-t tw-border-solid tw-border-white/10 tw-px-3 tw-pb-3 tw-pt-2"
          >
            <div className="tw-space-y-2.5">
              <div>
                <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                  Full Address
                </div>
                <div className="tw-mt-1 tw-flex tw-items-center tw-justify-between tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1.5">
                  <span className="tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
                    {address.wallet}
                  </span>
                  <button
                    type="button"
                    aria-label="Copy full address"
                    onClick={handleCopyAddress}
                    className={`tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400 ${
                      copiedItem === "full-address"
                        ? "tw-text-primary-400"
                        : "tw-text-iron-400 hover:tw-text-iron-200"
                    }`}
                  >
                    <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
                      <CopyIcon />
                    </div>
                  </button>
                </div>
              </div>

              {address.display && (
                <div>
                  <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                    ENS Name
                  </div>
                  <div className="tw-mt-1 tw-flex tw-items-center tw-justify-between tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1.5">
                    <span className="tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
                      {address.display}
                    </span>
                    <button
                      type="button"
                      aria-label="Copy ens name"
                      onClick={handleCopyEns}
                      className={`tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400 ${
                        copiedItem === "ens"
                          ? "tw-text-primary-400"
                          : "tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
                        <CopyIcon />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {statusMessage && (
        <div className="tw-pt-2 tw-text-xs tw-font-medium tw-text-iron-200">
          {statusMessage}
        </div>
      )}
    </li>
  );
}
