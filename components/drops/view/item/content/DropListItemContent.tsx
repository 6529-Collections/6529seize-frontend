import { DropFull } from "../../../../../entities/IDrop";
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
  readonly drop: DropFull;
  readonly showFull?: boolean;
}) {
  const { data: quotedDrop } = useQuery<DropFull>({
    queryKey: [QueryKey.DROP, drop.quoted_drop_id],
    queryFn: async () =>
      await commonApiFetch<DropFull>({
        endpoint: `/drops/${drop.quoted_drop_id}`,
      }),
    enabled: typeof drop.quoted_drop_id === "number",
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
