import {
  FieldType,
  getInitialTraitsValues,
  traitDefinitions,
} from "@/components/waves/memes/traits/schema";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  AdditionalMedia,
  AirdropEntry,
  AllowlistBatchRaw,
  OperationalData,
  PaymentInfo,
} from "../types/OperationalData";
import { AIRDROP_TOTAL } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";

export interface ExistingSubmissionMedia {
  readonly url: string;
  readonly mimeType: string;
}

export interface MemesSubmissionInitialDraft {
  readonly traits: TraitsData;
  readonly operationalData: OperationalData;
  readonly existingMedia: ExistingSubmissionMedia | null;
  readonly isAdditionalActionPromised: boolean;
}

const getDefaultOperationalData = (): OperationalData => ({
  airdrop_config: [{ id: "initial", address: "", count: AIRDROP_TOTAL }],
  payment_info: {
    payment_address: "",
    has_designated_payee: false,
    designated_payee_name: "",
  },
  allowlist_batches: [],
  additional_media: {
    artist_profile_media: [],
    artwork_commentary_media: [],
    preview_image: "",
    promo_video: "",
  },
  commentary: "",
  about_artist: "",
});

const parseJson = (value: string | undefined): unknown => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const booleanValue = (value: unknown): boolean =>
  String(value).trim().toLowerCase() === "true" ||
  String(value).trim() === "1" ||
  String(value).trim().toLowerCase() === "yes";

const numberValue = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildMetadataMap = (drop: ApiDrop): Map<string, string> =>
  new Map(
    drop.metadata.map((metadata) => [metadata.data_key, metadata.data_value])
  );

const buildTraitsDraft = (drop: ApiDrop): TraitsData => {
  const metadata = buildMetadataMap(drop);
  const traits: Record<keyof TraitsData, string | number | boolean> = {
    ...getInitialTraitsValues(),
  };
  const fieldDefinitions = traitDefinitions.flatMap(
    (section) => section.fields
  );

  fieldDefinitions.forEach((definition) => {
    const rawValue = metadata.get(definition.field);
    if (rawValue === undefined) {
      return;
    }

    switch (definition.type) {
      case FieldType.BOOLEAN:
        traits[definition.field] = booleanValue(rawValue);
        return;
      case FieldType.NUMBER:
        traits[definition.field] = numberValue(
          rawValue,
          traits[definition.field] as number
        );
        return;
      case FieldType.DROPDOWN:
      case FieldType.TEXT:
        traits[definition.field] = rawValue;
    }
  });

  traits.title = metadata.get("title") ?? drop.title ?? traits.title;
  traits.description =
    metadata.get("description") ??
    drop.parts.at(0)?.content ??
    traits.description;

  return traits as TraitsData;
};

const parsePaymentInfo = (value: unknown): PaymentInfo => {
  const defaults = getDefaultOperationalData().payment_info;
  if (!isRecord(value)) {
    return defaults;
  }

  return {
    payment_address: stringValue(value["payment_address"]),
    has_designated_payee: booleanValue(value["has_designated_payee"]),
    designated_payee_name: stringValue(value["designated_payee_name"]),
  };
};

const parseAirdropConfig = (value: unknown): AirdropEntry[] => {
  if (!Array.isArray(value)) {
    return getDefaultOperationalData().airdrop_config;
  }

  const entries = value.filter(isRecord).map((entry, index) => ({
    id: stringValue(entry["id"]) || `airdrop-${index}`,
    address: stringValue(entry["address"]),
    count: Math.max(0, Math.trunc(numberValue(entry["count"], 0))),
  }));

  return entries.length > 0
    ? entries
    : getDefaultOperationalData().airdrop_config;
};

const parseAllowlistBatches = (value: unknown): AllowlistBatchRaw[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((batch, index) => {
    const tokenIds = batch["token_ids_raw"] ?? batch["token_ids"];
    return {
      id: stringValue(batch["id"]) || `allowlist-${index}`,
      contract: stringValue(batch["contract"]),
      token_ids_raw: Array.isArray(tokenIds)
        ? tokenIds.map(String).join(", ")
        : stringValue(tokenIds),
    };
  });
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const parseAdditionalMedia = (value: unknown): AdditionalMedia => {
  const defaults = getDefaultOperationalData().additional_media;
  if (!isRecord(value)) {
    return defaults;
  }

  return {
    artist_profile_media: parseStringArray(value["artist_profile_media"]),
    artwork_commentary_media: parseStringArray(
      value["artwork_commentary_media"]
    ),
    preview_image: stringValue(value["preview_image"]),
    promo_video: stringValue(value["promo_video"]),
  };
};

const buildOperationalDataDraft = (drop: ApiDrop): OperationalData => {
  const metadata = buildMetadataMap(drop);

  return {
    airdrop_config: parseAirdropConfig(
      parseJson(metadata.get("airdrop_config"))
    ),
    payment_info: parsePaymentInfo(parseJson(metadata.get("payment_info"))),
    allowlist_batches: parseAllowlistBatches(
      parseJson(metadata.get("allowlist_batches"))
    ),
    additional_media: parseAdditionalMedia(
      parseJson(metadata.get("additional_media"))
    ),
    commentary: metadata.get("commentary") ?? "",
    about_artist: metadata.get("about_artist") ?? "",
  };
};

const buildExistingMediaDraft = (
  drop: ApiDrop
): ExistingSubmissionMedia | null => {
  const media = drop.parts.at(0)?.media.at(0);
  if (!media?.url || !media.mime_type) {
    return null;
  }

  return {
    url: media.url,
    mimeType: media.mime_type,
  };
};

export const buildMemesSubmissionDraftFromDrop = (
  drop: ApiDrop
): MemesSubmissionInitialDraft => ({
  traits: buildTraitsDraft(drop),
  operationalData: buildOperationalDataDraft(drop),
  existingMedia: buildExistingMediaDraft(drop),
  isAdditionalActionPromised: drop.is_additional_action_promised === true,
});
