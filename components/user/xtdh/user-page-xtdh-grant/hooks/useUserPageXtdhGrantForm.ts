import { useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiPost } from "@/services/api/common-api";

import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { validateGrantForm } from "../utils/validateGrantForm";
import type {
  GrantValidationResult,
  UserPageXtdhGrantForm,
} from "../types";
import { useIdentityTdhStats } from "@/hooks/useIdentityTdhStats";
import type { ApiXTdhCreateGrant } from "@/generated/models/ApiXTdhCreateGrant";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantTargetChain } from "@/generated/models/ApiXTdhGrantTargetChain";

export function useUserPageXtdhGrantForm(): UserPageXtdhGrantForm {
  const [contract, setContract] = useState<UserPageXtdhGrantForm["contract"]>(
    null
  );
  const [selection, setSelection] =
    useState<UserPageXtdhGrantForm["selection"]>(null);
  const [amount, setAmount] = useState<UserPageXtdhGrantForm["amount"]>(null);
  const [validUntil, setValidUntil] =
    useState<UserPageXtdhGrantForm["validUntil"]>(null);
  const [formKey, setFormKey] = useState<number>(0);
  const [submitError, setSubmitError] =
    useState<UserPageXtdhGrantForm["submitError"]>(null);
  const [submitSuccess, setSubmitSuccess] =
    useState<UserPageXtdhGrantForm["submitSuccess"]>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { invalidateIdentityTdhStats } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();

  const identity =
    connectedProfile?.query ??
    connectedProfile?.handle ??
    connectedProfile?.primary_wallet ??
    connectedProfile?.consolidation_key ??
    null;

  const {
    data: tdhStats,
    isLoading: isMaxGrantLoading,
    isError: isMaxGrantError,
  } = useIdentityTdhStats({
    identity,
    enabled: Boolean(identity),
    staleTime: 0,
  });

  const maxGrantRateRaw = tdhStats?.unusedRate ?? null;
  const maxGrantRate =
    Number.isFinite(maxGrantRateRaw) && maxGrantRateRaw !== null
      ? maxGrantRateRaw
      : null;

  const createGrantMutation = useMutation({
    mutationFn: async (payload: ApiXTdhCreateGrant) =>
      await commonApiPost<ApiXTdhCreateGrant, ApiXTdhGrant>({
        endpoint: "xtdh/grants",
        body: payload,
      }),
  });

  const resetSubmissionFeedback = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
  }, []);

  useEffect(() => {
    resetSubmissionFeedback();
  }, [amount, contract, resetSubmissionFeedback, selection, validUntil]);

  const handleSubmit = useCallback(async () => {
    if (isAuthorizing) {
      return;
    }

    resetSubmissionFeedback();

    const validationResult: GrantValidationResult = validateGrantForm({
      contract,
      selection,
      amount,
      validUntil,
      maxGrantRate,
      formKey,
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
      try {
        const { success } = await requestAuth();
        if (!success) {
          setSubmitError("Authentication failed. Please try again.");
          return;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Authentication failed. Please try again.";
        setSubmitError(message);
        setToast({ type: "error", message });
        return;
      }

      const payload: ApiXTdhCreateGrant = {
        target_chain: ApiXTdhGrantTargetChain.EthereumMainnet,
        target_contract: validatedContract.address,
        target_tokens: validatedSelection.allSelected
          ? []
          : validatedSelection.tokenIds.map((tokenId) => tokenId.toString()),
        valid_to: validatedValidUntil
          ? Math.floor(validatedValidUntil.getTime() / 1000)
          : null,
        rate: validatedAmount,
        is_irrevocable: false,
      };

      try {
        await createGrantMutation.mutateAsync(payload);
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.TDH_GRANTS],
        });
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.TDH_GRANTS, "pending-count"],
        });
        if (identity) {
          invalidateIdentityTdhStats({ identity });
        }
        const message = "Grant submitted. You will see it once processed.";
        setSubmitSuccess(message);
        setToast({ type: "success", message });
        setContract(null);
        setSelection(null);
        setAmount(null);
        setValidUntil(null);
        setFormKey((prev) => prev + 1);
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
    amount,
    contract,
    createGrantMutation,
    isAuthorizing,
    maxGrantRate,
    queryClient,
    requestAuth,
    resetSubmissionFeedback,
    selection,
    setToast,
    validUntil,
    identity,
    invalidateIdentityTdhStats,
  ]);

  return {
    contract,
    selection,
    amount,
    validUntil,
    formKey,
    submitError,
    submitSuccess,
    isSubmitting: createGrantMutation.isPending || isAuthorizing,
    maxGrantRate,
    isMaxGrantLoading,
    isMaxGrantError,
    setContract,
    setSelection,
    setAmount,
    setValidUntil,
    handleSubmit,
  };
}
