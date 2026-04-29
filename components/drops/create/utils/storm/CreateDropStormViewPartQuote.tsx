"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiQuotedDrop } from "@/generated/models/ApiQuotedDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useEffect, useState } from "react";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import DropPart from "@/components/drops/view/part/DropPart";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";

interface PartConfigWave {
  readonly name: string;
  readonly image: string | null;
  readonly id: string;
}

interface PartConfig {
  readonly dropId: string;
  readonly part: ApiDropPart;
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups: Array<ApiDropGroupMention>;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly createdAt: number;
  readonly wave: PartConfigWave;
  readonly dropTitle: string | null;
}

export default function CreateDropStormViewPartQuote({
  profile,
  quotedDrop,
}: {
  readonly profile: ProfileMinWithoutSubs;
  readonly quotedDrop: ApiQuotedDrop;
}) {
  const quotedDropId = quotedDrop.drop_id;
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: getDropQueryKey(quotedDropId),
    queryFn: () => fetchDropByIdBatched(quotedDropId),
    enabled: quotedDropId.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const getPartConfig = (): PartConfig | null => {
    if (!drop) {
      return null;
    }
    const part = drop.parts.find(
      (part) => part.part_id === quotedDrop.drop_part_id
    );
    if (!part) {
      return null;
    }
    return {
      dropId: drop.id,
      part,
      mentionedUsers: drop.mentioned_users,
      mentionedGroups: drop.mentioned_groups,
      mentionedWaves: drop.mentioned_waves,
      referencedNfts: drop.referenced_nfts,
      createdAt: drop.created_at,
      dropTitle: drop.title,
      wave: {
        name: drop.wave.name,
        image: drop.wave.picture,
        id: drop.wave.id,
      },
    };
  };

  const [partConfig, setPartConfig] = useState<PartConfig | null>(() =>
    getPartConfig()
  );
  useEffect(() => setPartConfig(getPartConfig()), [drop]);
  return (
    <div className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-2">
      {!!partConfig && (
        <DropPart
          dropId={partConfig.dropId}
          profile={profile}
          mentionedUsers={partConfig.mentionedUsers}
          mentionedGroups={partConfig.mentionedGroups}
          mentionedWaves={partConfig.mentionedWaves}
          referencedNfts={partConfig.referencedNfts}
          smallMenuIsShown={false}
          partContent={partConfig.part.content ?? null}
          partMedias={partConfig.part.media.map((media) => ({
            mimeType: media.mime_type,
            mediaSrc: media.url,
          }))}
          createdAt={partConfig.createdAt}
          wave={partConfig.wave}
          dropTitle={partConfig.dropTitle}
          size={DropPartSize.SMALL}
        />
      )}
    </div>
  );
}
