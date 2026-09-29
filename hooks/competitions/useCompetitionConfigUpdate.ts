"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useCompetition } from "@/contexts/CompetitionContext";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import type { ApiUpdateCompetitionRequest } from "@/generated/models/ApiUpdateCompetitionRequest";
import {
  isMultiCompetitionEnabled,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import {
  competitionEndpoint,
  invalidateCompetition,
  updateCompetition,
} from "@/services/api/competitions-api";

export function useCompetitionConfigEditable() {
  const { competition, hub } = useCompetition();
  return (
    isMultiCompetitionEnabled() &&
    hub.legacy_primary_competition_id !== competition.id &&
    competition.permissions.administer &&
    (competition.lifecycle === ApiCompetitionLifecycle.Draft ||
      competition.lifecycle === ApiCompetitionLifecycle.Published)
  );
}

/** Each mounted inline editor owns a version and a retryable request. */
export function useCompetitionConfigUpdate() {
  const { competition } = useCompetition();
  const editable = useCompetitionConfigEditable();
  const { requestAuth } = useAuth();
  const client = useQueryClient();
  const version = useRef(competition.config_version);
  const inFlight = useRef(false);
  const pending = useRef<{
    fingerprint: string;
    request: ApiUpdateCompetitionRequest;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"failure" | "conflict" | null>(null);
  const save = async (
    fingerprint: string,
    update: (config: ApiCompetitionDraftInput) => ApiCompetitionDraftInput
  ) => {
    if (!editable || inFlight.current || error === "conflict") return false;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const identity = {
      waveId: competition.wave_id,
      competitionId: competition.id,
    };
    try {
      if (!(await requestAuth()).success) return false;
      if (pending.current?.fingerprint !== fingerprint) {
        const config = await commonApiFetch<ApiCompetitionDraftInput>({
          endpoint: `${competitionEndpoint(identity)}/configuration`,
          errorMode: "structured",
        });
        pending.current = {
          fingerprint,
          request: {
            idempotency_key: newCompetitionRequestKey(),
            config_version: version.current,
            config: update(config),
          },
        };
      }
      await updateCompetition(identity, pending.current.request);
      pending.current = null;
      await invalidateCompetition(client, identity);
      return true;
    } catch (failure) {
      const conflict = getStructuredApiErrorStatus(failure) === 409;
      setError(conflict ? "conflict" : "failure");
      if (conflict) await invalidateCompetition(client, identity);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return { busy, error, save };
}
