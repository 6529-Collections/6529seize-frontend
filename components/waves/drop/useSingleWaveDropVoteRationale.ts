"use client";

import { useCallback, useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";

interface UseSingleWaveDropVoteRationaleParams {
  readonly drop: ApiDrop;
  readonly voteTotal: number;
  readonly voteChange: number;
}

interface UseSingleWaveDropVoteRationaleResult {
  readonly rationaleText: string;
  readonly shouldPostRationale: boolean;
  readonly handlePostRationaleChange: (postRationale: boolean) => void;
  readonly handleRationaleTextChange: (nextText: string) => void;
  readonly submitRationaleReply: (targetDrop: ApiDrop) => Promise<void>;
}

interface VoteRationaleDraft {
  readonly dropId: string;
  readonly generatedRationaleText: string;
  readonly rationaleText: string;
  readonly postRationale: boolean;
  readonly hasPostRationalePreference: boolean;
}

const buildRationaleReplyRequest = ({
  drop,
  partId,
  content,
  isSafeWallet,
  address,
}: {
  readonly drop: ApiDrop;
  readonly partId: number;
  readonly content: string;
  readonly isSafeWallet: boolean;
  readonly address: string | undefined;
}): ApiCreateDropRequest => ({
  wave_id: drop.wave.id,
  reply_to: {
    drop_id: drop.id,
    drop_part_id: partId,
  },
  drop_type: ApiDropType.Chat,
  title: null,
  parts: [
    {
      content,
      quoted_drop: null,
      media: [],
    },
  ],
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_waves: [],
  mentioned_groups: [],
  metadata: [],
  signature: null,
  is_safe_signature: isSafeWallet,
  signer_address: address ?? "",
});

export const useSingleWaveDropVoteRationale = (
  params: UseSingleWaveDropVoteRationaleParams
): UseSingleWaveDropVoteRationaleResult => {
  const { drop, voteTotal, voteChange } = params;
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const generatedRationaleText = getVoteRationaleReplyMarkdown({
    voteTotal,
    voteChange,
    locale,
  });
  const [rationaleDraft, setRationaleDraft] =
    useState<VoteRationaleDraft | null>(null);

  const activeRationaleDraft =
    rationaleDraft?.dropId === drop.id ? rationaleDraft : null;
  const usesGeneratedPrefix =
    activeRationaleDraft?.rationaleText.startsWith(
      activeRationaleDraft.generatedRationaleText
    ) ?? false;
  const rationaleText =
    usesGeneratedPrefix && activeRationaleDraft !== null
      ? `${generatedRationaleText}${activeRationaleDraft.rationaleText.slice(
          activeRationaleDraft.generatedRationaleText.length
        )}`
      : (activeRationaleDraft?.rationaleText ?? generatedRationaleText);
  const postRationale = activeRationaleDraft?.postRationale ?? false;

  const handlePostRationaleChange = useCallback(
    (nextPostRationale: boolean) => {
      setRationaleDraft({
        dropId: drop.id,
        generatedRationaleText,
        rationaleText,
        postRationale: nextPostRationale,
        hasPostRationalePreference: true,
      });
    },
    [drop.id, generatedRationaleText, rationaleText]
  );

  const { mutateAsync: createRationaleReply } = useMutation({
    mutationFn: async (requestBody: ApiCreateDropRequest) =>
      await commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: "drops",
        body: requestBody,
      }),
    onSuccess: (createdReply) => {
      void addOptimisticDrop({ drop: createdReply });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "waves.voteRationale.postErrorTitle"),
        description: t(locale, "waves.voteRationale.postErrorRetry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  const handleRationaleTextChange = useCallback(
    (nextText: string) => {
      setRationaleDraft((currentDraft) => {
        const currentDropDraft =
          currentDraft?.dropId === drop.id ? currentDraft : null;
        const keepPostRationalePreference =
          currentDropDraft?.hasPostRationalePreference ?? false;
        const currentPostRationale = currentDropDraft?.postRationale ?? false;

        return {
          dropId: drop.id,
          generatedRationaleText,
          rationaleText: nextText,
          postRationale: keepPostRationalePreference
            ? currentPostRationale
            : true,
          hasPostRationalePreference: keepPostRationalePreference,
        };
      });
    },
    [drop.id, generatedRationaleText]
  );

  const submitRationaleReply = useCallback(
    async (targetDrop: ApiDrop) => {
      if (!postRationale) {
        return;
      }

      const trimmedRationaleText = rationaleText.trim();
      if (trimmedRationaleText.length === 0) {
        setToast({
          type: "error",
          title: t(locale, "waves.voteRationale.postErrorTitle"),
          description: t(locale, "waves.voteRationale.postErrorEmpty"),
        });
        return;
      }

      const partId = targetDrop.parts.at(0)?.part_id;
      if (partId === undefined) {
        setToast({
          type: "error",
          title: t(locale, "waves.voteRationale.postErrorTitle"),
          description: t(locale, "waves.voteRationale.postErrorNoTarget"),
        });
        return;
      }

      const requestBody = buildRationaleReplyRequest({
        drop: targetDrop,
        partId,
        content: trimmedRationaleText,
        isSafeWallet,
        address,
      });

      try {
        await createRationaleReply(requestBody);
      } catch {
        // The mutation displays the recovery toast.
      }
    },
    [
      address,
      createRationaleReply,
      isSafeWallet,
      locale,
      rationaleText,
      setToast,
      postRationale,
    ]
  );

  return {
    rationaleText,
    shouldPostRationale: postRationale,
    handlePostRationaleChange,
    handleRationaleTextChange,
    submitRationaleReply,
  };
};
