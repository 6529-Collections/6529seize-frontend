import { Drop } from "../../../../../entities/IDrop";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropListItemContentMarkdown from "./DropListItemContentMarkdown";
import DropListItemContentQuote from "./DropListItemContentQuote";

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
  const { data: quotedDrop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, drop.quoted_drop_id],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `/drops/${drop.quoted_drop_id}`,
      }),
    enabled: typeof drop.quoted_drop_id === "string",
  });

  return (
    <div>
      <DropListItemContentMarkdown drop={drop} showFull={showFull} />
      {quotedDrop && (
        <DropListItemContentQuote drop={quotedDrop} showFull={showFull} />
      )}
    </div>
  );
}
