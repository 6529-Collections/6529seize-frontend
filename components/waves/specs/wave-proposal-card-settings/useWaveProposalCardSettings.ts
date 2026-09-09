"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { isValidProposalCardExcerptMaxCharacters } from "@/helpers/waves/proposal-card.helpers";
import {
  getWaveProposalCardConfigFromMetadata,
  getWaveProposalCardMetadataUpdate,
} from "@/helpers/waves/wave-metadata.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWave } from "@/hooks/useWave";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";
import type {
  CreateWaveProposalCardConfig,
  CreateWaveProposalCardMode,
} from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface ProposalCardDraft {
  readonly mode: CreateWaveProposalCardMode;
  readonly excerptMaxCharacters: string;
  readonly showMediaThumbnail: boolean;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getDraft = (
  proposalCards: CreateWaveProposalCardConfig
): ProposalCardDraft => ({
  mode: proposalCards.mode,
  excerptMaxCharacters: String(proposalCards.excerptMaxCharacters),
  showMediaThumbnail: proposalCards.showMediaThumbnail,
});

const getConfig = (
  draft: ProposalCardDraft
): CreateWaveProposalCardConfig | null => {
  const excerptMaxCharacters = Number(draft.excerptMaxCharacters.trim());
  if (
    draft.mode === "custom" &&
    !isValidProposalCardExcerptMaxCharacters(excerptMaxCharacters)
  ) {
    return null;
  }

  return {
    mode: draft.mode,
    excerptMaxCharacters,
    showMediaThumbnail: draft.showMediaThumbnail,
  };
};

const getValueLabel = (
  proposalCards: CreateWaveProposalCardConfig,
  locale: SupportedLocale
): string => {
  return t(
    locale,
    proposalCards.mode === "standard"
      ? "waves.proposalCard.mode.standard.label"
      : "waves.proposalCard.mode.custom.label"
  );
};

export function useWaveProposalCardSettings(wave: ApiWave) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { isMemesWave, isCurationWave, isQuorumWave } = useWave(wave);
  const isSupported =
    (wave.wave.type === ApiWaveType.Rank ||
      wave.wave.type === ApiWaveType.Approve) &&
    !isMemesWave &&
    !isCurationWave &&
    !isQuorumWave;
  const metadataQuery = useWaveMetadata(wave.id, { enabled: isSupported });
  const metadata = metadataQuery.data ?? null;
  const proposalCards = useMemo(
    () => getWaveProposalCardConfigFromMetadata(wave.id, metadata),
    [metadata, wave.id]
  );
  const [draftState, setDraftState] = useState<ProposalCardDraft>(() =>
    getDraft(proposalCards)
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const draftConfig = getConfig(draftState);
  const pendingUpdate = draftConfig
    ? getWaveProposalCardMetadataUpdate({
        waveId: wave.id,
        metadata,
        proposalCards: draftConfig,
      })
    : null;
  const hasPendingChanges = Boolean(
    pendingUpdate &&
    (pendingUpdate.create.length > 0 || pendingUpdate.deleteIds.length > 0)
  );

  const setDraft = useCallback((nextDraft: ProposalCardDraft) => {
    setDraftState(nextDraft);
    setSaveError(null);
  }, []);
  const resetEditor = useCallback(() => {
    setDraftState(getDraft(proposalCards));
    setSaveError(null);
  }, [proposalCards]);
  const saveSettings = useCallback(
    (closeEditor: () => void) => {
      if (!draftConfig || !hasPendingChanges) {
        return;
      }

      void (async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
          const { success } = await requestAuth();
          if (!success) {
            const message = t(
              locale,
              "waves.proposalCard.settings.toastAuthFailed"
            );
            setSaveError(message);
            setToast({ type: "error", message });
            return;
          }

          const update = getWaveProposalCardMetadataUpdate({
            waveId: wave.id,
            metadata,
            proposalCards: draftConfig,
          });
          await replaceWaveMetadata({
            waveId: wave.id,
            metadata,
            ...update,
          });
          closeEditor();
        } catch (error) {
          const message = t(
            locale,
            "waves.proposalCard.settings.toastSaveFailedTitle"
          );
          setSaveError(message);
          setToast({
            type: "error",
            title: message,
            description: t(locale, "waves.proposalCard.settings.toastRetry"),
            details: getToastErrorDetails(error, getErrorMessage(error)),
          });
        } finally {
          await queryClient
            .invalidateQueries({
              queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
            })
            .catch(() => undefined);
          setIsSaving(false);
        }
      })();
    },
    [
      draftConfig,
      hasPendingChanges,
      locale,
      metadata,
      queryClient,
      requestAuth,
      setToast,
      wave.id,
    ]
  );

  return {
    canEdit:
      !metadataQuery.isLoading &&
      !metadataQuery.isError &&
      canEditWave({ connectedProfile, activeProfileProxy, wave }),
    draft: draftState,
    editLabel: t(locale, "waves.proposalCard.settings.editLabel"),
    hasExcerptError: draftState.mode === "custom" && draftConfig === null,
    isSaving,
    isSupported,
    resetEditor,
    rowLabel: t(locale, "waves.proposalCard.settings.rowLabel"),
    saveError,
    saveSettings,
    setDraft,
    submitDisabled: !draftConfig || !hasPendingChanges,
    valueLabel: getValueLabel(proposalCards, locale),
  };
}
