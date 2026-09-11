import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ApiCollectAnalysisRequest } from "@/generated/models/ApiCollectAnalysisRequest";
import { ApiCollectAnalysisRequestTraitEnum } from "@/generated/models/ApiCollectAnalysisRequest";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import { ApiCollectKind } from "@/generated/models/ApiCollectKind";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  MEMES_CONTRACT,
  GRADIENT_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type {
  CollectGoalDraft,
  CollectGoalOption,
  CollectPlanView,
  CollectProfileView,
} from "./collect.types";

export function collectAssetHref(asset: ApiCollectAsset): string {
  const token = encodeURIComponent(asset.token_id);
  if (asset.family === ApiCollectFamily.Memes) return `/the-memes/${token}`;
  if (asset.family === ApiCollectFamily.Gradients)
    return `/6529-gradient/${token}`;
  return `/nextgen/token/${token}`;
}

export function collectAssetIdentity(
  assetKey: string
): { family: ApiCollectFamily; tokenId: string } | null {
  const [chain, contract, tokenId] = assetKey.split(":");
  if (
    chain !== "1" ||
    !contract ||
    !tokenId ||
    !/^(0|[1-9][0-9]{0,77})$/.test(tokenId)
  )
    return null;
  const families: Readonly<Record<string, ApiCollectFamily>> = {
    [MEMES_CONTRACT.toLowerCase()]: ApiCollectFamily.Memes,
    [GRADIENT_CONTRACT.toLowerCase()]: ApiCollectFamily.Gradients,
    [NEXTGEN_CONTRACT.toLowerCase()]: ApiCollectFamily.Pebbles,
  };
  const family = families[contract.toLowerCase()];
  return family === undefined ? null : { family, tokenId };
}

export function collectGoalOptions(
  catalog: ApiCollectCatalog | undefined,
  draft: CollectGoalDraft,
  locale: SupportedLocale
): CollectGoalOption[] {
  if (!catalog) return [];
  switch (draft.intent) {
    case "season":
      return catalog.seasons.map((season) => ({
        id: String(season.id),
        label: season.name,
      }));
    case "artist":
      return catalog.artists.map((artist) => ({
        id: artist.id,
        label: artist.name,
      }));
    case "full_set":
      return [
        { id: "memes", label: t(locale, "collect.collection.memes") },
        { id: "gradients", label: t(locale, "collect.collection.gradients") },
      ];
    case "pebbles_set":
      return [
        ...catalog.pebbles_traits.map((facet) => ({
          id: facet.trait,
          label: facet.trait,
        })),
        { id: "Ultimate", label: t(locale, "collect.goal.ultimate") },
      ];
    case "specific":
    case "explore":
    case "lowest":
    case "tdh":
      return [];
  }
}

export function collectAnalysisRequest(
  profileId: string,
  catalog: ApiCollectCatalog,
  draft: CollectGoalDraft
): ApiCollectAnalysisRequest {
  const base = {
    profile_id: profileId,
    catalog_version: catalog.version,
    target_copies: draft.targetCount,
  };
  switch (draft.intent) {
    case "season": {
      const season = catalog.seasons.find(
        (item) => String(item.id) === draft.definitionId
      );
      if (!season) throw new Error("INVALID_DEFINITION");
      return {
        ...base,
        kind: ApiCollectKind.MemesSeason,
        season_id: season.id,
      };
    }
    case "artist": {
      if (!catalog.artists.some((item) => item.id === draft.definitionId))
        throw new Error("INVALID_DEFINITION");
      return {
        ...base,
        kind: ApiCollectKind.MemesArtist,
        artist_id: draft.definitionId,
        include_collaborations: draft.includeCollaborations,
      };
    }
    case "full_set": {
      if (!["memes", "gradients"].includes(draft.definitionId))
        throw new Error("INVALID_DEFINITION");
      return {
        ...base,
        kind:
          draft.definitionId === "memes"
            ? ApiCollectKind.MemesFullSet
            : ApiCollectKind.GradientsFullSet,
      };
    }
    case "pebbles_set": {
      if (draft.definitionId === "Ultimate")
        return {
          ...base,
          kind: ApiCollectKind.PebblesUltimate,
          target_copies: "1",
        };
      const trait = Object.values(ApiCollectAnalysisRequestTraitEnum).find(
        (value) => value.toString() === draft.definitionId
      );
      if (trait === undefined) throw new Error("INVALID_DEFINITION");
      return {
        ...base,
        kind: ApiCollectKind.PebblesTraitSet,
        trait,
        target_copies: "1",
      };
    }
    case "specific":
    case "explore":
    case "lowest":
    case "tdh":
      throw new Error("UNSUPPORTED_GOAL");
  }
}

export function collectAnalysisView(
  analysis: ApiCollectAnalysis,
  profile: CollectProfileView,
  title: string,
  locale: SupportedLocale
): CollectPlanView | null {
  if (analysis.account.profile_id !== profile.id) return null;
  return {
    id: analysis.analysis_id,
    revision: `${analysis.catalog_version}:${analysis.account.membership_hash}`,
    title,
    profile,
    coverageLabel: t(locale, "collect.goal.coverage", {
      owned: analysis.satisfied_count,
      total: analysis.required_count,
    }),
    snapshotLabel: t(locale, "collect.goal.snapshot", {
      block: analysis.holdings_snapshot.block_number ?? "—",
    }),
    requirements: analysis.requirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      detail: t(locale, "collect.goal.requirement", {
        owned: requirement.owned_quantity,
        target: requirement.target_quantity,
      }),
      status: requirement.missing_quantity === "0" ? "owned" : "missing",
    })),
    totalLabel: null,
    blockers: [],
    assumptions: [
      t(locale, "collect.goal.confirmedWallets", {
        count: analysis.account.wallets.length,
      }),
    ],
    reviewDisabledReason: t(
      locale,
      analysis.complete ? "collect.goal.complete" : "collect.goal.quoteNeeded"
    ),
  };
}
