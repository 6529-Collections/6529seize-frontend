import { keepPreviousData } from "@tanstack/query-core";
import { useQuery } from "@tanstack/react-query";
import { ApiGroupFull } from "../../../../../generated/models/ApiGroupFull";
import { commonApiFetch } from "../../../../../services/api/common-api";
import GroupCard from "./GroupCard";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { LinkText } from "../../../../drops/view/part/DropPartMarkdownLinkHandlers";

export default function GroupCardChat({
  href,
  groupId,
}: {
  readonly href: string;
  readonly groupId: string;
}) {
  const { data: group } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, groupId],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${groupId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!groupId,
  });

  return (
    <>
      <LinkText href={href} relativeHref={`/network?group=${groupId}`} />
      <div className="tw-flex-1 tw-min-w-0">
        <GroupCard
          group={group}
          userPlaceholder={href}
          titlePlaceholder={groupId}
        />
      </div>
    </>
  );
}
