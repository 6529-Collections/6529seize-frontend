import { isAddress } from "viem";
import type { GrantValidationParams, GrantValidationResult } from "../types";

const isSelectionError = (
  selection: GrantValidationParams["selection"]
): selection is Extract<NonNullable<GrantValidationParams["selection"]>, { type: "error" }> =>
  Boolean(selection && "type" in selection && selection.type === "error");

export const validateGrantForm = ({
  contract,
  selection,
  amount,
  validUntil,
  maxGrantRate,
}: GrantValidationParams): GrantValidationResult => {
  if (!contract) {
    return {
      success: false,
      message: "Select a collection before submitting.",
    };
  }

  if (!isAddress(contract.address)) {
    return {
      success: false,
      message: "The selected collection address is invalid.",
    };
  }

  if (!selection) {
    return {
      success: false,
      message: "Select the tokens that should receive the grant.",
    };
  }

  if (isSelectionError(selection)) {
    return {
      success: false,
      message: selection.error,
    };
  }

  if (
    selection.contractAddress.toLowerCase() !==
    contract.address.toLowerCase()
  ) {
    return {
      success: false,
      message: "Token selection does not match the selected collection.",
    };
  }

  if (!selection.allSelected && selection.tokenIds.length === 0) {
    return {
      success: false,
      message: "Select at least one token or grant to all tokens.",
    };
  }

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      message: "Enter a valid amount greater than zero.",
    };
  }

  if (
    maxGrantRate !== null &&
    maxGrantRate !== undefined &&
    Number.isFinite(maxGrantRate) &&
    amount > maxGrantRate
  ) {
    return {
      success: false,
      message: `Amount exceeds your available grant rate (${Math.floor(maxGrantRate * 10) / 10
        }).`,
    };
  }

  if (validUntil !== null && validUntil.getTime() <= Date.now()) {
    return {
      success: false,
      message: "Expiration must be in the future.",
    };
  }

  return { success: true, contract, selection, amount, validUntil };
};
