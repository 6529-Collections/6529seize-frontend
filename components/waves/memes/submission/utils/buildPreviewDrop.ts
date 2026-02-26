"use client";

import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { DropSize, getOptimisticDropId } from "@/helpers/waves/drop.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import { validateStrictAddress } from "./addressValidation";
import { objectEntries } from "./objectEntries";

import type { OperationalData } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";

interface PreviewMediaSelection {
  readonly mediaSource: "upload" | "url";
  readonly selectedFile: File | null;
  readonly externalUrl: string;
  readonly externalMimeType: string;
  readonly isExternalValid: boolean;
}

interface BuildPreviewDropInput {
  readonly wave: ApiWave;
  readonly traits: TraitsData;
  readonly operationalData?: OperationalData | undefined;
  readonly mediaSelection: PreviewMediaSelection;
  readonly uploadArtworkUrl: string;
  readonly connectedProfile: ApiIdentity | null;
}

const FALLBACK_MEDIA_URL =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

const buildMetadata = (
  traits: TraitsData,
  operationalData?: OperationalData
): ApiDropMetadata[] => {
  const metadata: ApiDropMetadata[] = objectEntries(traits)
    .map(([key, value]) => ({
      data_key: String(key),
      data_value: value.toString(),
    }))
    .filter((item) => item.data_value.length > 0);

  if (!operationalData) {
    return metadata;
  }

  metadata.push(
    {
      data_key: "payment_info",
      data_value: JSON.stringify(operationalData.payment_info),
    },
    {
      data_key: "commentary",
      data_value: operationalData.commentary,
    },
    {
      data_key: "about_artist",
      data_value: operationalData.about_artist,
    }
  );

  if (operationalData.airdrop_config.length > 0) {
    const validEntries = operationalData.airdrop_config.filter((entry) => {
      const trimmedAddress = entry.address.trim();
      return validateStrictAddress(trimmedAddress) && entry.count > 0;
    });

    if (validEntries.length > 0) {
      metadata.push({
        data_key: "airdrop_config",
        data_value: JSON.stringify(validEntries),
      });
    }
  }

  if (operationalData.allowlist_batches.length > 0) {
    metadata.push({
      data_key: "allowlist_batches",
      data_value: JSON.stringify(
        operationalData.allowlist_batches.map((batch) => ({
          contract: batch.contract,
          token_ids: batch.token_ids_raw || "",
        }))
      ),
    });
  }

  metadata.push({
    data_key: "additional_media",
    data_value: JSON.stringify(operationalData.additional_media),
  });

  return metadata;
};

const buildPreviewMedia = ({
  mediaSelection,
  uploadArtworkUrl,
}: {
  readonly mediaSelection: PreviewMediaSelection;
  readonly uploadArtworkUrl: string;
}) => {
  if (
    mediaSelection.mediaSource === "upload" &&
    mediaSelection.selectedFile &&
    uploadArtworkUrl
  ) {
    return {
      url: uploadArtworkUrl,
      mime_type: mediaSelection.selectedFile.type || "image/jpeg",
    };
  }

  if (
    mediaSelection.mediaSource === "url" &&
    mediaSelection.isExternalValid &&
    mediaSelection.externalUrl
  ) {
    return {
      url: mediaSelection.externalUrl,
      mime_type: mediaSelection.externalMimeType || "text/html",
    };
  }

  return {
    url: FALLBACK_MEDIA_URL,
    mime_type: "image/gif",
  };
};

export const buildPreviewDrop = ({
  wave,
  traits,
  operationalData,
  mediaSelection,
  uploadArtworkUrl,
  connectedProfile,
}: BuildPreviewDropInput): ExtendedDrop => {
  const id = getOptimisticDropId();
  const now = Date.now();
  const media = buildPreviewMedia({ mediaSelection, uploadArtworkUrl });
  const metadata = buildMetadata(traits, operationalData);
  const primaryAddress =
    connectedProfile?.primary_wallet ??
    "0x0000000000000000000000000000000000000000";

  return {
    type: DropSize.FULL,
    stableKey: id,
    stableHash: id,
    id,
    serial_no: now,
    drop_type: ApiDropType.Participatory,
    rank: null,
    wave: {
      id: wave.id,
      name: wave.name,
      picture: wave.picture,
      description_drop_id: wave.description_drop.id,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      authenticated_user_admin: false,
      visibility_group_id: null,
      participation_group_id: null,
      chat_group_id: null,
      voting_group_id: null,
      admin_group_id: null,
      voting_period_start: wave.voting.period?.min ?? null,
      voting_period_end: wave.voting.period?.max ?? null,
      voting_credit_type: wave.voting.credit_type,
      admin_drop_deletion_enabled: wave.wave.admin_drop_deletion_enabled,
      forbid_negative_votes: wave.voting.forbid_negative_votes,
      pinned: wave.pinned,
    },
    author: {
      id: connectedProfile?.id ?? "preview-user",
      handle: connectedProfile?.handle ?? "preview-user",
      pfp: connectedProfile?.pfp ?? null,
      banner1_color: getBannerColorValue(connectedProfile?.banner1),
      banner2_color: getBannerColorValue(connectedProfile?.banner2),
      cic: connectedProfile?.cic ?? 0,
      rep: connectedProfile?.rep ?? 0,
      tdh: connectedProfile?.tdh ?? 0,
      tdh_rate: connectedProfile?.tdh_rate ?? 0,
      xtdh: connectedProfile?.xtdh ?? 0,
      xtdh_rate: connectedProfile?.xtdh_rate ?? 0,
      level: connectedProfile?.level ?? 0,
      primary_address: primaryAddress,
      subscribed_actions: [],
      archived: false,
      active_main_stage_submission_ids:
        connectedProfile?.active_main_stage_submission_ids ?? [],
      winner_main_stage_drop_ids:
        connectedProfile?.winner_main_stage_drop_ids ?? [],
      is_wave_creator: connectedProfile?.is_wave_creator ?? false,
    },
    created_at: now,
    updated_at: null,
    title: traits.title || "Untitled Submission",
    parts: [
      {
        part_id: 1,
        content: traits.description || null,
        media: [media],
        quoted_drop: null,
      },
    ],
    parts_count: 1,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_waves: [],
    metadata,
    rating: 6529,
    realtime_rating: 6529420,
    rating_prediction: 69420,
    top_raters: [],
    raters_count: 69,
    context_profile_context: null,
    subscribed_actions: [],
    is_signed: false,
    reactions: [],
    boosts: 0,
    hide_link_preview: false,
  };
};
