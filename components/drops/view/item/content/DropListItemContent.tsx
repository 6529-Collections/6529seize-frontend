import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropListItemContentMarkdown from "./DropListItemContentMarkdown";
import DropListItemContentQuote from "./DropListItemContentQuote";
import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

export default function DropListItemContent({
  drop,
  showFull = false,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
}) {
  // TODO make it multiple parts
  const part = drop.parts[0];

  const { data: quotedDrop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, part.quoted_drop?.drop_id],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `/drops/${part.quoted_drop?.drop_id}`,
      }),
    enabled: typeof part.quoted_drop?.drop_id === "string",
  });

  return (
    <div className="tw-space-y-2 ">
      {drop.parts.map((part) => (
        <div
          key={part.part_id}
          className="tw-border-2 tw-border-solid tw-border-blue-600"
        >
          <DropPart
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={part.content ?? null}
            partMedia={
              part.media.length
                ? {
                    mimeType: part.media[0].mime_type,
                    mediaSrc: part.media[0].url,
                  }
                : null
            }
            showFull={showFull}
          />
          {quotedDrop && (
            <DropListItemContentQuote drop={quotedDrop} showFull={showFull} />
          )}
        </div>
      ))}
    </div>
  );
}
