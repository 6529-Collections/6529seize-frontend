import { DropFull } from "../../../../../entities/IDrop";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropListItemContentMarkdown from "./DropListItemContentMarkdown";
import DropWrapper from "../../../create/utils/DropWrapper";
import { useEffect } from "react";
export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

export default function DropListItemContent({
  drop,
}: {
  readonly drop: DropFull;
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
    <div className="tw-w-full">
      <DropListItemContentMarkdown drop={drop} />
      {quotedDrop && (
        <div className="tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-rounded-xl tw-p-2 tw-ml-4 tw-mt-4">
          <DropWrapper drop={quotedDrop} isQuoted={true}>
            <DropListItemContentMarkdown drop={quotedDrop} />
          </DropWrapper>
        </div>
      )}
    </div>
  );
}
