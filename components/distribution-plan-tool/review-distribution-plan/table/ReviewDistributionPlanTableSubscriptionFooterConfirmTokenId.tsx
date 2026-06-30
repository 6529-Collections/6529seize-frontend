"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  extractAllNumbers,
  formatAddress,
  isValidPositiveInteger,
} from "@/helpers/Helpers";
import { useState } from "react";
import { Modal } from "react-bootstrap";

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

  const isValid = isValidPositiveInteger(tokenId);

  const handleConfirm = () => {
    if (isValid) {
      props.onConfirm(tokenId);
    }
  };

  return (
    <Modal
      show
      onHide={() => {}}
      backdrop="static"
      keyboard={false}
      className="tailwind-scope"
    >
      <Modal.Header>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Confirm Token ID
        </Modal.Title>
      </Modal.Header>
      <hr className="tw-my-0" />
      <Modal.Body>
        <div className="tw-container tw-mx-auto">
          <div className="tw-py-2">
            <div>
              Contract: The Memes - <span>{formatAddress(contract)}</span>
            </div>
          </div>
          <div className="tw-py-2">
            <div>
              Token ID:{" "}
              <input
                style={{
                  color: "black",
                  width: "100px",
                }}
                min={1}
                step={1}
                type="number"
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
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          disabled={!isValid}
          onClick={handleConfirm}
          type="button"
          className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          Confirm
        </button>
      </Modal.Footer>
    </Modal>
  );
}
