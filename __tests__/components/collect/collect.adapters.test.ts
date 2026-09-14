import {
  collectAnalysisRequest,
  collectAnalysisView,
} from "@/components/collect/collect.adapters";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import { ApiCollectKind } from "@/generated/models/ApiCollectKind";
import type { CollectGoalDraft } from "@/components/collect/collect.types";

const catalog: ApiCollectCatalog = {
  version: "catalog-1",
  chain_id: 1,
  seasons: [{ id: 1, name: "Season 1", asset_keys: ["one"], current: false }],
  artists: [],
  pebbles_traits: [],
  tdh_snapshot: null,
};
const draft: CollectGoalDraft = {
  intent: "season",
  definitionId: "1",
  targetCount: "2",
  budgetEth: "",
  horizonDays: "30",
  includeCollaborations: true,
};
it("builds an account-scoped second-set request without a signer or custody filter", () => {
  expect(collectAnalysisRequest("profile-one", catalog, draft)).toEqual({
    profile_id: "profile-one",
    catalog_version: "catalog-1",
    kind: ApiCollectKind.MemesSeason,
    target_copies: "2",
    season_id: 1,
  });
});
it("rejects a definition absent from the current catalog", () => {
  expect(() =>
    collectAnalysisRequest("profile-one", catalog, {
      ...draft,
      definitionId: "42",
    })
  ).toThrow();
});
it("cannot render another account's analysis during a profile switch", () => {
  const analysis = {
    account: { profile_id: "profile-two" },
  } as ApiCollectAnalysis;
  expect(
    collectAnalysisView(
      analysis,
      { id: "profile-one", displayName: "one" },
      "Season 1",
      "en-US"
    )
  ).toBeNull();
});
