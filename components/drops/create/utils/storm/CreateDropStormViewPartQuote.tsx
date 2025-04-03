import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiQuotedDrop } from "../../../../../generated/models/ApiQuotedDrop";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { ApiDropPart } from "../../../../../generated/models/ApiDropPart";
import DropPart, { DropPartSize } from "../../../view/part/DropPart";
import { ApiDropMentionedUser } from "../../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../../generated/models/ApiDropReferencedNFT";
import { ProfileMinWithoutSubs } from "../../../../../helpers/ProfileTypes";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";

interface PartConfigWave {
  readonly name: string;
  readonly image: string | null;
  readonly id: string;
}

interface PartConfig {
  readonly part: ApiDropPart;
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
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
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, quotedDrop.drop_id],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `/drops/${quotedDrop.drop_id}`,
      }),
    enabled: typeof quotedDrop.drop_id === "string",
    placeholderData: keepPreviousData,
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
      part,
      mentionedUsers: drop.mentioned_users,
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

  const [partConfig, setPartConfig] = useState<PartConfig | null>(
    getPartConfig()
  );
  useEffect(() => setPartConfig(getPartConfig()), [drop]);
  return (
    <div className="tw-mt-2 tw-p-2 tw-border-iron-700 tw-rounded-lg tw-border tw-border-solid tw-w-full">
      {!!partConfig && (
        <DropPart
          profile={profile}
          mentionedUsers={partConfig.mentionedUsers}
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
