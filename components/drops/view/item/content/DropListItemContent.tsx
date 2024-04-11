import { DropFull } from "../../../../../entities/IDrop";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropListItemContentMarkdown from "./DropListItemContentMarkdown";
import DropWrapper from "../../../create/utils/DropWrapper";

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
    <div>
      <DropListItemContentMarkdown drop={drop} />
      {quotedDrop && (
        <div className="tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-bg-iron-900 tw-rounded-xl tw-p-2 tw-mt-2">
          <DropWrapper drop={quotedDrop}>
            <DropListItemContentMarkdown drop={quotedDrop} />
          </DropWrapper>
        </div>
      )}
    </div>
  );
}
