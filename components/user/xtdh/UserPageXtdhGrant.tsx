"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAddress } from "viem";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";
import UserPageXtdhGrantSummary from "./UserPageXtdhGrantSummary";
import UserPageXtdhGrantAmount from "./UserPageXtdhGrantAmount";
import UserPageXtdhGrantValidity from "./UserPageXtdhGrantValidity";
import UserPageXtdhGrantSelection from "./UserPageXtdhGrantSelection";
import UserPageXtdhGrantSubmit from "./UserPageXtdhGrantSubmit";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiPost } from "@/services/api/common-api";
import { ApiCreateTdhGrant } from "@/generated/models/ApiCreateTdhGrant";
import { ApiTdhGrant } from "@/generated/models/ApiTdhGrant";
import { ApiTdhGrantTargetChain } from "@/generated/models/ApiTdhGrantTargetChain";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

type GrantValidationParams = {
  contract: ContractOverview | null;
  selection: NftPickerSelection | null;
  amount: number | null;
  validUntil: Date | null;
};

type GrantValidationResult =
  | { success: false; message: string }
  | {
      success: true;
      contract: ContractOverview;
      selection: NftPickerSelection;
      amount: number;
      validUntil: Date | null;
    };

const validateGrantForm = ({
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

export default function UserPageXtdhGrant() {
  const [contract, setContract] = useState<ContractOverview | null>(null);
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const { requestAuth, setToast } = useContext(AuthContext);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const queryClient = useQueryClient();

  const createGrantMutation = useMutation({
    mutationFn: async (payload: ApiCreateTdhGrant) =>
      await commonApiPost<ApiCreateTdhGrant, ApiTdhGrant>({
        endpoint: "tdh-grants",
        body: payload,
      }),
  });

  useEffect(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [contract, selection, amount, validUntil]);

  const handleSubmit = useCallback(async () => {
    if (isAuthorizing) {
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);

    const validationResult = validateGrantForm({
      contract,
      selection,
      amount,
      validUntil,
    });

    if (!validationResult.success) {
      setSubmitError(validationResult.message);
      return;
    }

    const {
      contract: validatedContract,
      selection: validatedSelection,
      amount: validatedAmount,
      validUntil: validatedValidUntil,
    } = validationResult;

    setIsAuthorizing(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        setSubmitError("Authentication failed. Please try again.");
        return;
      }

      const payload: ApiCreateTdhGrant = {
        target_chain: ApiTdhGrantTargetChain.EthereumMainnet,
        target_contract: validatedContract.address,
        target_tokens: validatedSelection.allSelected
          ? []
          : validatedSelection.tokenIdsRaw.map((tokenId) => tokenId.toString()),
        valid_to: validatedValidUntil
          ? Math.floor(validatedValidUntil.getTime() / 1000)
          : null,
        tdh_rate: validatedAmount,
        is_irrevocable: false,
      };

      try {
        await createGrantMutation.mutateAsync(payload);
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.TDH_GRANTS],
        });
        const message = "Grant submitted. You will see it once processed.";
        setSubmitSuccess(message);
        setToast({ type: "success", message });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to submit the grant.";
        setSubmitError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsAuthorizing(false);
    }
  }, [
    contract,
    selection,
    amount,
    validUntil,
    requestAuth,
    createGrantMutation,
    queryClient,
    setToast,
    isAuthorizing,
  ]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <UserPageXtdhGrantSummary
        contract={contract}
        selection={selection}
        amount={amount}
        validUntil={validUntil}
      />

      <UserPageXtdhGrantSelection
        onSelectionChange={setSelection}
        onContractChange={setContract}
      />

      <UserPageXtdhGrantAmount amount={amount} onAmountChange={setAmount} />

      <UserPageXtdhGrantValidity value={validUntil} onChange={setValidUntil} />

      <UserPageXtdhGrantSubmit
        contract={contract}
        selection={selection}
        amount={amount}
        validUntil={validUntil}
        onSubmit={handleSubmit}
        isSubmitting={createGrantMutation.isPending || isAuthorizing}
        errorMessage={submitError}
        successMessage={submitSuccess}
      />
    </div>
  );
}
