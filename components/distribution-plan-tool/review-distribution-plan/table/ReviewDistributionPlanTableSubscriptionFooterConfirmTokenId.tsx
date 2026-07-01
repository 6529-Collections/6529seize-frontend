"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { useId, useState } from "react";
import { ReviewDistributionPlanTableSubscriptionFooterModal } from "./ReviewDistributionPlanTableSubscriptionFooterModal";

export function ConfirmTokenIdModal(
  props: Readonly<{
    plan: AllowlistDescription;
    onConfirm(tokenId: string): void;
  }>
) {
  const contract = MEMES_CONTRACT;
  const numbers = extractAllNumbers(props.plan.name);
  const initialTokenId = numbers.length > 0 ? numbers[0]!.toString() : "";
  const [tokenId, setTokenId] = useState<string>(
    isValidPositiveInteger(initialTokenId) ? initialTokenId : ""
  );
  const tokenIdHintId = useId();

  const isValid = isValidPositiveInteger(tokenId);

  const handleConfirm = () => {
    if (isValid) {
      props.onConfirm(tokenId);
    }
  };

  return (
    <ReviewDistributionPlanTableSubscriptionFooterModal
      title="Confirm Token ID"
      onClose={() => {}}
      closeButton={false}
      isDismissable={false}
      footer={
        <button
          disabled={!isValid}
          onClick={handleConfirm}
          type="button"
          className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          Confirm
        </button>
      }
    >
      <div className="tw-py-2">
        <div>
          Contract: The Memes - <span>{formatAddress(contract)}</span>
        </div>
      </div>
      <div className="tw-py-2">
        <div>
          Token ID:{" "}
          <input
            className="tw-w-[100px] tw-text-black"
            min={1}
            step={1}
            type="number"
            aria-label="Token ID"
            aria-describedby={tokenIdHintId}
            value={tokenId}
            onChange={(e) => {
              setTokenId(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) {
                handleConfirm();
              }
            }}
          />
          <span id={tokenIdHintId} className="tw-sr-only">
            Enter a positive token ID to continue.
          </span>
        </div>
      </div>
    </ReviewDistributionPlanTableSubscriptionFooterModal>
  );
}
