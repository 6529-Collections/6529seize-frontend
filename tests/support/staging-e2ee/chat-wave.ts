import { expect } from "@playwright/test";
import {
  stagingApiError,
  stagingApiRequest,
  type StagingE2eeSession,
} from "./session";

/** A public chat wave anyone can view and chat in, as the create form sends. */
function chatWaveRequest(name: string, description: string) {
  const now = Date.now();
  return {
    name,
    description_drop: {
      title: null,
      parts: [{ content: description, quoted_drop: null, media: [] }],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
      signature: null,
    },
    picture: null,
    voting: {
      scope: { group_id: null },
      credit_type: "TDH_PLUS_XTDH",
      credit_scope: "WAVE",
      credit_category: null,
      creditor_id: null,
      signature_required: false,
      period: { min: now, max: null },
      forbid_negative_votes: false,
    },
    visibility: { scope: { group_id: null } },
    participation: {
      scope: { group_id: null },
      no_of_applications_allowed_per_participant: null,
      required_media: [],
      required_metadata: [],
      signature_required: false,
      period: { min: now, max: null },
      terms: null,
    },
    chat: { scope: { group_id: null }, enabled: true, links_disabled: false },
    wave: {
      admin_drop_deletion_enabled: true,
      type: "CHAT",
      winning_threshold: null,
      winning_threshold_min_duration_ms: null,
      max_winners: null,
      max_votes_per_identity_to_drop: null,
      time_lock_ms: null,
      admin_group: { group_id: null },
      decisions_strategy: null,
    },
    outcomes: [],
  };
}

export async function createChatWave(
  session: StagingE2eeSession,
  name: string
): Promise<string> {
  const result = await stagingApiRequest(
    session,
    "POST",
    "waves",
    chatWaveRequest(name, `Throwaway QA wave (${name}).`)
  );
  const id = (result.json as { id?: unknown } | null)?.id;
  const error = stagingApiError(result.json);
  expect(
    result.ok && typeof id === "string",
    `${session.label}: staging refused to create a chat wave for a new profile (HTTP ${result.status}${error ? `: ${error.slice(0, 300)}` : ""})`
  ).toBe(true);
  return typeof id === "string" ? id : "";
}
