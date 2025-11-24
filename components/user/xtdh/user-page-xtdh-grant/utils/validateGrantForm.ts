import { isAddress } from "viem";
import type { GrantValidationParams, GrantValidationResult } from "../types";

export const validateGrantForm = ({
  contract,
  selection,
  amount,
  validUntil,
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

  if (selection.contractAddress !== contract.address) {
    return {
      success: false,
      message: "Token selection does not match the selected collection.",
    };
  }

  if (!selection.allSelected && selection.tokenIdsRaw.length === 0) {
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

  if (validUntil !== null && validUntil.getTime() <= Date.now()) {
    return {
      success: false,
      message: "Expiration must be in the future.",
    };
  }

  return { success: true, contract, selection, amount, validUntil };
};
