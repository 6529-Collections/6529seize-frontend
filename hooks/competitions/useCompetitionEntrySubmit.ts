"use client";

import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiCreateCompetitionEntryRequest } from "@/generated/models/ApiCreateCompetitionEntryRequest";
import { useCompetitionSignatureFor } from "./useCompetitionSignature";
import { useCompetitionViewer } from "./useCompetitionQueries";
import {
  createCompetitionEntry,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";
import {
  isRejectedCompetitionCommand,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";

/** Reuse a signed command after an uncertain response, including a failed hydration. */
export function useCompetitionEntrySubmit(competition: ApiCompetition | null) {
  const client = useQueryClient();
  const viewer = useCompetitionViewer();
  const sign = useCompetitionSignatureFor(competition);
  const pending = useRef<{
    fingerprint: string;
    request: ApiCreateCompetitionEntryRequest;
  } | null>(null);
  return async (content: ApiCreateDropRequest) => {
    if (content.wave_id !== competition?.wave_id)
      throw new Error("Competition entry scope is required");
    // Native commands sign the content separately from the legacy drop envelope.
    const {
      signature_message: _message,
      signer_address: _signer,
      is_safe_signature: _safeSignature,
      ...unsigned
    } = content;
    const drop = { ...unsigned, signature: null };
    const fingerprint = JSON.stringify({
      drop,
      competitionId: competition.id,
      version: competition.config_version,
      viewer,
    });
    if (pending.current?.fingerprint !== fingerprint) {
      const request: ApiCreateCompetitionEntryRequest = {
        idempotency_key: newCompetitionRequestKey(),
        config_version: competition.config_version,
        drop,
      };
      if (competition.participation.signature_required)
        request.signature = await sign(
          "ENTRY_CREATE",
          { drop, drop_id: null },
          null,
          null
        );
      pending.current = { fingerprint, request };
    }
    const identity = {
      waveId: competition.wave_id,
      competitionId: competition.id,
    };
    let accepted = false;
    try {
      const entry = await createCompetitionEntry(
        identity,
        pending.current.request
      );
      accepted = true;
      const saved = await fetchDropV2ById(entry.drop_id, undefined, {
        includeFullMetadata: true,
      });
      pending.current = null;
      await invalidateCompetition(client, identity);
      return saved;
    } catch (error) {
      if (!accepted && isRejectedCompetitionCommand(error))
        pending.current = null;
      throw error;
    }
  };
}
