import { useContext, useEffect, useState } from "react";
import { QuotedDrop } from "../../../../../generated/models/QuotedDrop";
import { AuthContext } from "../../../../auth/Auth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../../generated/models/Drop";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";

import { DropPart as IDropPart } from "../../../../../generated/models/DropPart";
import DropPart, { DropPartSize } from "../DropPart";

export default function DropPartQuote({
  quotedDrop,
  marginLeft = true,
  onRedropClick,
}: {
  readonly quotedDrop: QuotedDrop;
  readonly marginLeft?: boolean;
  readonly onRedropClick?: (serialNo: number) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const { data: drop, error } = useQuery<Drop>({
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
    placeholderData: keepPreviousData,
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

  if (error) {
    return (
      <div
        className={`${
          marginLeft && "tw-ml-[54px]"
        } tw-mt-2 tw-px-4 tw-py-2 tw-border-iron-700 tw-rounded-lg tw-border tw-border-solid`}
      >
        Drop not found
      </div>
    );
  }

  if (!quotedPart || !drop) {
    return null;
  }

  return (
    <div
      className={`${
        marginLeft && "tw-ml-[54px]"
      } tw-mt-2 tw-px-4 tw-pb-4 tw-pt-1 tw-border-iron-700 tw-rounded-lg tw-border tw-border-solid`}
    >
      <DropPart
        profile={drop.author}
        mentionedUsers={drop.mentioned_users}
        referencedNfts={drop.referenced_nfts}
        partContent={quotedPart.content ?? null}
        smallMenuIsShown={false}
        partMedias={
          quotedPart.media.map(media => ({
            mimeType: media.mime_type,
            mediaSrc: media.url,
          }))}
        showFull={false}
        createdAt={drop.created_at}
        dropTitle={drop.title}
        wave={{
          name: drop.wave.name,
          image: drop.wave.picture,
          id: drop.wave.id,
        }}
        size={DropPartSize.SMALL}
        onContentClick={() =>
          onRedropClick && onRedropClick(drop.serial_no)
        }
      />
    </div>
  );
}
