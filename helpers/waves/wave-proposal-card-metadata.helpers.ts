import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import type {
  CreateWaveProposalCardConfig,
  WaveProposalCardPresentation,
  WaveProposalCardRecipe,
} from "@/types/waves.types";
import {
  DEFAULT_PROPOSAL_CARD_RECIPE,
  normalizeProposalCardExcerptMaxCharacters,
} from "./proposal-card.helpers";

export const WAVE_PROPOSAL_CARD_METADATA_KEYS = {
  proposalCardRecipe: "wave_display.proposals.card_recipe",
  compactProposalCards: "wave_display.proposals.compact",
} as const;

const ENABLED_PROPOSAL_CARDS_METADATA_VALUE = "true";

// Existing rollout targets predate this metadata key. New Waves opt in through
// persisted metadata, and an explicit metadata value always wins over this set.
export const INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS: ReadonlySet<string> =
  new Set(["5f207393-5418-4a75-8738-e40edb44a94d"]);

interface WaveProposalCardMetadataUpdate {
  readonly create: ApiCreateWaveMetadataRequest[];
  readonly deleteIds: number[];
}

type StoredProposalCardPresentationV1 =
  | {
      readonly version: 1;
      readonly layout: "full";
    }
  | {
      readonly version: 1;
      readonly layout: "summary";
      readonly excerpt_max_characters: number;
      readonly show_media_thumbnail: boolean;
    };

const getMetadataRows = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): ApiWaveMetadata[] =>
  metadata?.filter((item) => item.data_key === dataKey) ?? [];

const getLatestMetadataItem = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): ApiWaveMetadata | null => {
  const rows = getMetadataRows({ metadata, dataKey });
  const firstRow = rows[0];
  if (!firstRow) {
    return null;
  }

  let latest = firstRow;
  for (const item of rows) {
    if (item.id > latest.id) {
      latest = item;
    }
  }

  return latest;
};

const parseProposalCardPresentation = (
  value: string | null | undefined
): WaveProposalCardPresentation | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== 1 ||
      !("layout" in parsed)
    ) {
      return null;
    }

    if (parsed.layout === "full") {
      return {
        version: 1,
        layout: "full",
      };
    }

    if (
      parsed.layout !== "summary" ||
      !("excerpt_max_characters" in parsed) ||
      typeof parsed.excerpt_max_characters !== "number" ||
      !("show_media_thumbnail" in parsed) ||
      typeof parsed.show_media_thumbnail !== "boolean"
    ) {
      return null;
    }

    return {
      version: 1,
      layout: "summary",
      excerptMaxCharacters: normalizeProposalCardExcerptMaxCharacters(
        parsed.excerpt_max_characters
      ),
      showMediaThumbnail: parsed.show_media_thumbnail,
    };
  } catch {
    return null;
  }
};

const getDefaultProposalCardConfig = (): CreateWaveProposalCardConfig => ({
  mode: "custom",
  excerptMaxCharacters: DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
  showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
});

const getStandardProposalCardConfig = (): CreateWaveProposalCardConfig => ({
  mode: "standard",
  excerptMaxCharacters: DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
  showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
});

export const getWaveProposalCardConfigFromMetadata = (
  waveId: string | null | undefined,
  metadata: readonly ApiWaveMetadata[] | null | undefined
): CreateWaveProposalCardConfig => {
  const presentationRow = getLatestMetadataItem({
    metadata,
    dataKey: WAVE_PROPOSAL_CARD_METADATA_KEYS.proposalCardRecipe,
  });
  if (presentationRow) {
    const presentation = parseProposalCardPresentation(
      presentationRow.data_value
    );
    if (presentation?.layout === "summary") {
      return {
        mode: "custom",
        excerptMaxCharacters: presentation.excerptMaxCharacters,
        showMediaThumbnail: presentation.showMediaThumbnail,
      };
    }

    return getStandardProposalCardConfig();
  }

  const legacyRow = getLatestMetadataItem({
    metadata,
    dataKey: WAVE_PROPOSAL_CARD_METADATA_KEYS.compactProposalCards,
  });
  if (legacyRow) {
    const value = legacyRow.data_value.trim().toLowerCase();
    return value === ENABLED_PROPOSAL_CARDS_METADATA_VALUE
      ? getDefaultProposalCardConfig()
      : getStandardProposalCardConfig();
  }

  const normalizedWaveId = waveId?.trim().toLowerCase();
  return normalizedWaveId &&
    INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS.has(normalizedWaveId)
    ? getDefaultProposalCardConfig()
    : getStandardProposalCardConfig();
};

export function getWaveProposalCardMetadataRequest(
  proposalCards: CreateWaveProposalCardConfig
): ApiCreateWaveMetadataRequest {
  const presentation: StoredProposalCardPresentationV1 =
    proposalCards.mode === "custom"
      ? {
          version: 1,
          layout: "summary",
          excerpt_max_characters: normalizeProposalCardExcerptMaxCharacters(
            proposalCards.excerptMaxCharacters
          ),
          show_media_thumbnail: proposalCards.showMediaThumbnail,
        }
      : {
          version: 1,
          layout: "full",
        };

  return {
    data_key: WAVE_PROPOSAL_CARD_METADATA_KEYS.proposalCardRecipe,
    data_value: JSON.stringify(presentation),
  };
}

const areProposalCardConfigsEqual = (
  first: CreateWaveProposalCardConfig,
  second: CreateWaveProposalCardConfig
): boolean => {
  if (first.mode !== second.mode) {
    return false;
  }

  return (
    first.mode === "standard" ||
    (normalizeProposalCardExcerptMaxCharacters(first.excerptMaxCharacters) ===
      normalizeProposalCardExcerptMaxCharacters(second.excerptMaxCharacters) &&
      first.showMediaThumbnail === second.showMediaThumbnail)
  );
};

export const getWaveProposalCardMetadataUpdate = ({
  waveId,
  metadata,
  proposalCards,
}: {
  readonly waveId: string | null | undefined;
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly proposalCards: CreateWaveProposalCardConfig;
}): WaveProposalCardMetadataUpdate => {
  const current = getWaveProposalCardConfigFromMetadata(waveId, metadata);
  if (areProposalCardConfigsEqual(current, proposalCards)) {
    return { create: [], deleteIds: [] };
  }

  const rows = [
    ...getMetadataRows({
      metadata,
      dataKey: WAVE_PROPOSAL_CARD_METADATA_KEYS.proposalCardRecipe,
    }),
    ...getMetadataRows({
      metadata,
      dataKey: WAVE_PROPOSAL_CARD_METADATA_KEYS.compactProposalCards,
    }),
  ];

  return {
    create: [getWaveProposalCardMetadataRequest(proposalCards)],
    deleteIds: rows.map((row) => row.id),
  };
};

export const getWaveProposalCardRecipeFromMetadata = (
  waveId: string | null | undefined,
  metadata: readonly ApiWaveMetadata[] | null | undefined
): WaveProposalCardRecipe | null => {
  const proposalCards = getWaveProposalCardConfigFromMetadata(waveId, metadata);
  if (proposalCards.mode !== "custom") {
    return null;
  }

  return {
    version: 1,
    layout: "summary",
    excerptMaxCharacters: proposalCards.excerptMaxCharacters,
    showMediaThumbnail: proposalCards.showMediaThumbnail,
  };
};

export const getWaveProposalCardsEnabledFromMetadata = (
  waveId: string | null | undefined,
  metadata: readonly ApiWaveMetadata[] | null | undefined
): boolean => getWaveProposalCardRecipeFromMetadata(waveId, metadata) !== null;
