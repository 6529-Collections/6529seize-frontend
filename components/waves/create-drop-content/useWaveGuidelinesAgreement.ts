"use client";

import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveCustomRulesFromMetadata } from "@/helpers/waves/wave-metadata.helpers";
import { fetchWaveMetadata } from "@/services/api/waves-v2-api";
import { useCallback, useEffect, useRef, useState } from "react";

export type WaveGuidelinesAgreementResult =
  | "accepted"
  | "declined"
  | "unavailable";

interface PendingGuidelinesDecision {
  readonly scopeKey: string;
  readonly resolve: (result: WaveGuidelinesAgreementResult) => void;
}

interface GuidelinesDialogState {
  readonly guidelines: string;
  readonly scopeKey: string;
}

const hasPostedInWave = (wave: ApiWave): boolean =>
  // Backend dropper metrics count CHAT and PARTICIPATORY drops separately.
  (wave.metrics.your_drops_count ?? 0) > 0 ||
  wave.metrics.your_participation_drops_count > 0;

export function useWaveGuidelinesAgreement({
  profileId,
  wave,
}: {
  readonly profileId: string | null;
  readonly wave: ApiWave;
}) {
  const scopeKey = `${wave.id}:${profileId ?? "anonymous"}`;
  const activeScopeKeyRef = useRef(scopeKey);
  const pendingDecisionRef = useRef<PendingGuidelinesDecision | null>(null);
  const requestRef = useRef<{
    readonly scopeKey: string;
    readonly promise: Promise<WaveGuidelinesAgreementResult>;
  } | null>(null);
  const satisfiedScopeKeysRef = useRef(new Set<string>());
  const [dialogState, setDialogState] = useState<GuidelinesDialogState | null>(
    null
  );
  if (dialogState !== null && dialogState.scopeKey !== scopeKey) {
    setDialogState(null);
  }

  const settlePendingDecision = useCallback(
    (result: WaveGuidelinesAgreementResult) => {
      const pendingDecision = pendingDecisionRef.current;
      pendingDecisionRef.current = null;
      setDialogState(null);
      pendingDecision?.resolve(result);
    },
    []
  );

  useEffect(() => {
    if (activeScopeKeyRef.current === scopeKey) {
      return;
    }

    activeScopeKeyRef.current = scopeKey;
    const pendingDecision = pendingDecisionRef.current;
    if (pendingDecision?.scopeKey !== scopeKey) {
      pendingDecisionRef.current = null;
      pendingDecision?.resolve("declined");
    }
  }, [scopeKey]);

  useEffect(
    () => () => {
      pendingDecisionRef.current?.resolve("declined");
      pendingDecisionRef.current = null;
    },
    []
  );

  const requestGuidelinesAgreement = useCallback(
    (
      dropType: ApiDropType | undefined
    ): Promise<WaveGuidelinesAgreementResult> => {
      if (
        dropType !== ApiDropType.Chat ||
        hasPostedInWave(wave) ||
        satisfiedScopeKeysRef.current.has(scopeKey)
      ) {
        return Promise.resolve("accepted");
      }

      const activeRequest = requestRef.current;
      if (activeRequest?.scopeKey === scopeKey) {
        return activeRequest.promise;
      }

      const request = (async (): Promise<WaveGuidelinesAgreementResult> => {
        const metadata = await fetchWaveMetadata({ waveId: wave.id }).catch(
          () => null
        );
        if (metadata === null) {
          return "unavailable";
        }

        if (activeScopeKeyRef.current !== scopeKey) {
          return "declined";
        }

        const guidelines = getWaveCustomRulesFromMetadata(metadata);
        if (!guidelines) {
          return "accepted";
        }

        return await new Promise<WaveGuidelinesAgreementResult>((resolve) => {
          pendingDecisionRef.current = {
            resolve,
            scopeKey,
          };
          setDialogState({ guidelines, scopeKey });
        });
      })();

      requestRef.current = { promise: request, scopeKey };
      void request.then(
        () => {
          if (requestRef.current?.promise === request) {
            requestRef.current = null;
          }
        },
        () => {
          if (requestRef.current?.promise === request) {
            requestRef.current = null;
          }
        }
      );
      return request;
    },
    [scopeKey, wave]
  );

  const agreeToGuidelines = useCallback(() => {
    settlePendingDecision("accepted");
  }, [settlePendingDecision]);

  const declineGuidelines = useCallback(() => {
    settlePendingDecision("declined");
  }, [settlePendingDecision]);

  const markChatSubmitted = useCallback(() => {
    satisfiedScopeKeysRef.current.add(scopeKey);
  }, [scopeKey]);

  return {
    agreeToGuidelines,
    declineGuidelines,
    dialogGuidelines:
      dialogState?.scopeKey === scopeKey ? dialogState.guidelines : null,
    markChatSubmitted,
    requestGuidelinesAgreement,
  };
}
