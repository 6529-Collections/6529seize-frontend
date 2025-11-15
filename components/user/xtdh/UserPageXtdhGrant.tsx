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

export default function UserPageXtdhGrant() {
  const [contract, setContract] = useState<ContractOverview | null>(null);
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const { requestAuth, setToast } = useContext(AuthContext);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
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
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!contract) {
      setSubmitError("Select a collection before submitting.");
      return;
    }

    if (!isAddress(contract.address)) {
      setSubmitError("The selected collection address is invalid.");
      return;
    }

    if (!selection) {
      setSubmitError("Select the tokens that should receive the grant.");
      return;
    }

    if (selection.contractAddress !== contract.address) {
      setSubmitError("Token selection does not match the selected collection.");
      return;
    }

    if (!selection.allSelected && selection.tokenIdsRaw.length === 0) {
      setSubmitError("Select at least one token or grant to all tokens.");
      return;
    }

    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      setSubmitError("Enter a valid amount greater than zero.");
      return;
    }

    if (validUntil !== null && validUntil.getTime() <= Date.now()) {
      setSubmitError("Expiration must be in the future.");
      return;
    }

    const { success } = await requestAuth();
    if (!success) {
      setSubmitError("Authentication failed. Please try again.");
      return;
    }

    const payload: ApiCreateTdhGrant = {
      target_chain: ApiTdhGrantTargetChain.EthereumMainnet,
      target_contract: contract.address,
      target_tokens: selection.allSelected
        ? []
        : selection.tokenIdsRaw.map((tokenId) => tokenId.toString()),
      valid_to: validUntil ? Math.floor(validUntil.getTime() / 1000) : null,
      tdh_rate: amount,
      is_irrevocable: false,
    };

    try {
      await createGrantMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] });
      const message = "Grant submitted. You will see it once processed.";
      setSubmitSuccess(message);
      setToast({ type: "success", message });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit the grant.";
      setSubmitError(message);
      setToast({ type: "error", message });
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
        isSubmitting={createGrantMutation.isPending}
        errorMessage={submitError}
        successMessage={submitSuccess}
      />
    </div>
  );
}
