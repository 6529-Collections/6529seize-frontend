import { useContext, useEffect, useState } from "react";
import { QuotedDrop } from "../../../../../generated/models/QuotedDrop";
import { AuthContext } from "../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../../generated/models/Drop";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropWrapper from "../../../create/utils/DropWrapper";
import { DropPart as IDropPart } from "../../../../../generated/models/DropPart";
import DropPart from "../DropPart";

export default function DropPartQuote({
  quotedDrop,
}: {
  readonly quotedDrop: QuotedDrop;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const { data: drop } = useQuery<Drop>({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: quotedDrop.drop_id,
        context_profile: connectedProfile?.profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${quotedDrop.drop_id}`,
        params: connectedProfile?.profile?.handle
          ? { context_profile: connectedProfile.profile.handle }
          : {},
      }),
  });

  const [quotedPart, setQuotedPart] = useState<IDropPart | null>(null);
  useEffect(() => {
    if (!drop) {
      return;
    }
    const part = drop.parts.find(
      (part) => part.part_id === quotedDrop.drop_part_id
    );
    if (!part) {
      return;
    }
    setQuotedPart(part);
  }, [drop]);

  if (!quotedPart || !drop) {
    return null;
  }

  return (
    <div className="tw-mt-4 tw-p-4 tw-border-iron-700 tw-rounded-lg tw-border tw-border-solid">
      <DropWrapper drop={drop}>
        <div className="tw-w-full">
          <DropPart
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={quotedPart.content ?? null}
            partMedia={
              quotedPart.media.length
                ? {
                    mimeType: quotedPart.media[0].mime_type,
                    mediaSrc: quotedPart.media[0].url,
                  }
                : null
            }
            showFull={false}
          />
        </div>
      </DropWrapper>
    </div>
  );
}