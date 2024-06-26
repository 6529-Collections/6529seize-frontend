import { useQuery } from "@tanstack/react-query";
import { QuotedDrop } from "../../../../../generated/models/QuotedDrop";
import { Drop } from "../../../../../generated/models/Drop";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useState } from "react";
import { DropPart as IDropPart } from "../../../../../generated/models/DropPart";
import DropPart from "../../../view/part/DropPart";
import { DropMentionedUser } from "../../../../../generated/models/DropMentionedUser";
import { DropReferencedNFT } from "../../../../../generated/models/DropReferencedNFT";

interface PartConfig {
  readonly part: IDropPart;
  readonly mentionedUsers: Array<DropMentionedUser>;
  readonly referencedNfts: Array<DropReferencedNFT>;
}

export default function CreateDropStormViewPartQuote({
  quotedDrop,
}: {
  readonly quotedDrop: QuotedDrop;
}) {
  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, quotedDrop.drop_id],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `/drops/${quotedDrop.drop_id}`,
      }),
    enabled: typeof quotedDrop.drop_id === "string",
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
    };
  };

  const [partConfig, setPartConfig] = useState<PartConfig | null>(
    getPartConfig()
  );
  useEffect(() => setPartConfig(getPartConfig()), [drop]);
  return (
    <div>
      {!!partConfig && (
        <DropPart
          mentionedUsers={partConfig.mentionedUsers}
          referencedNfts={partConfig.referencedNfts}
          partContent={partConfig.part.content ?? null}
          partMedia={
            partConfig.part.media.length
              ? {
                  mimeType: partConfig.part.media[0].mime_type,
                  mediaSrc: partConfig.part.media[0].url,
                }
              : null
          }
          showFull={false}
        />
      )}
    </div>
  );
}
