import type { Page } from "@playwright/test";
import type { ApiCompetitionDraftInput } from "../../generated/models/ApiCompetitionDraftInput";
import { expect } from "../testHelpers";

export const CREATED_COMPETITION_ID = "creation-draft";
export const CREATED_COMPETITION_WAVE_ID =
  "00000000-0000-4000-8000-000000000536";

/** Isolated native draft/publish fixture; existing wave creation remains server guarded. */
export async function installNativeCompetitionCreationApi(page: Page) {
  let configuration: ApiCompetitionDraftInput | null = null;
  let version = 1;
  let published = false;
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  const pageResult = (data: unknown[]) => ({
    data,
    has_more: false,
    next_cursor: null,
  });
  const competition = () => {
    if (!configuration)
      throw new Error("No native competition draft was saved");
    const { participation, voting, rules } = configuration;
    return {
      id: CREATED_COMPETITION_ID,
      wave_id: CREATED_COMPETITION_WAVE_ID,
      title: configuration.title,
      description: configuration.description,
      type: rules.type,
      lifecycle: published ? "PUBLISHED" : "DRAFT",
      computed_phase: published ? "VOTING_OPEN" : "DRAFT",
      config_version: version,
      participation: {
        group_id: participation.scope.group_id,
        signature_required: participation.signature_required,
        max_entries_per_participant:
          participation.no_of_applications_allowed_per_participant,
        required_metadata: participation.required_metadata,
        required_media: participation.required_media,
        submission_type: participation.submission_strategy?.type ?? null,
        identity_submission_strategy:
          participation.submission_strategy?.config.who_can_be_submitted ??
          null,
        identity_submission_duplicates:
          participation.submission_strategy?.config.duplicates ?? null,
        starts_at: participation.period?.min ?? null,
        ends_at: participation.period?.max ?? null,
        terms: participation.terms,
      },
      voting: {
        group_id: voting.scope.group_id,
        credit_type: voting.credit_type,
        credit_scope: voting.credit_scope,
        credit_category: voting.credit_category,
        credit_creditor: voting.creditor_id,
        credit_nfts: voting.credit_nfts ?? [],
        signature_required: voting.signature_required,
        starts_at: voting.period?.min ?? null,
        ends_at: voting.period?.max ?? null,
        max_votes_per_identity_to_entry: rules.max_votes_per_identity_to_drop,
        forbid_negative_votes: voting.forbid_negative_votes,
      },
      decisions: {
        strategy: rules.decisions_strategy,
        next_decision_time:
          rules.decisions_strategy?.first_decision_time ?? null,
        winning_min_threshold: rules.winning_threshold,
        winning_max_threshold: null,
        winning_threshold_min_duration_ms:
          rules.winning_threshold_min_duration_ms ?? 0,
        max_winners: rules.max_winners,
        time_lock_ms: rules.time_lock_ms,
      },
      winners: {
        max_winners: rules.max_winners,
        winning_min_threshold: rules.winning_threshold,
        winning_max_threshold: null,
        winning_threshold_min_duration_ms:
          rules.winning_threshold_min_duration_ms ?? 0,
      },
      outcome_config: configuration.outcomes,
      presentation: configuration.presentation,
      capabilities: [],
      permissions: {
        view: true,
        submit: published,
        vote: published,
        administer: true,
      },
      created_at: 1,
      updated_at: 1,
      published_at: published ? 1 : null,
      ended_at: null,
      cancelled_at: null,
      archived_at: null,
    };
  };
  await page.route(
    `**/api/v3/waves/${CREATED_COMPETITION_WAVE_ID}**`,
    (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const suffix =
        path.split(`/api/v3/waves/${CREATED_COMPETITION_WAVE_ID}`)[1] ?? "";
      if (request.method() !== "GET") {
        const body = request.postDataJSON() as Record<string, unknown>;
        expect(body["idempotency_key"]).toEqual(expect.any(String));
        requests.push({ path, body });
        if (
          (request.method() === "POST" && suffix === "/competitions") ||
          (request.method() === "PATCH" &&
            suffix === `/competitions/${CREATED_COMPETITION_ID}`)
        ) {
          configuration = body["config"] as ApiCompetitionDraftInput;
          expect(["RANK", "APPROVE"]).toContain(configuration.rules.type);
          expect(configuration.title.trim()).not.toBe("");
          if (request.method() === "PATCH") version++;
          return route.fulfill({ json: competition() });
        }
        if (
          request.method() === "POST" &&
          suffix === `/competitions/${CREATED_COMPETITION_ID}/actions/publish`
        ) {
          expect(body["config_version"]).toBe(version);
          published = true;
          version++;
          return route.fulfill({ json: competition() });
        }
        return route.fulfill({
          status: 409,
          json: { message: "Unexpected native creation command" },
        });
      }
      if (!suffix)
        return route.fulfill({
          json: {
            id: CREATED_COMPETITION_WAVE_ID,
            name: "Sandbox Created Wave",
            legacy_primary_competition_id: null,
            permissions: {
              view: true,
              administer: true,
              create_competition: true,
            },
          },
        });
      if (suffix === "/default-competition")
        return route.fulfill({
          json: {
            competition_id: published ? CREATED_COMPETITION_ID : null,
            evaluated_at: Date.now(),
            next_refresh_at: null,
          },
        });
      if (suffix === "/competitions")
        return route.fulfill({
          json: pageResult(configuration ? [competition()] : []),
        });
      if (suffix === `/competitions/${CREATED_COMPETITION_ID}` && configuration)
        return route.fulfill({ json: competition() });
      if (suffix.endsWith("/configuration") && configuration)
        return route.fulfill({ json: configuration });
      if (suffix.endsWith("/activity")) return route.fulfill({ json: [] });
      return route.fulfill({ json: pageResult([]) });
    }
  );
  return {
    requests,
    configuration: () => configuration,
    published: () => published,
  };
}
