import { keepPreviousData } from "@tanstack/query-core";
import { useQuery } from "@tanstack/react-query";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";
import GroupCard from "./GroupCard";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";

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
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <GroupCard
          group={group}
          userPlaceholder={href}
          titlePlaceholder={groupId}
        />
      </div>
      <ChatItemHrefButtons
        href={href}
        relativeHref={`/network?group=${groupId}`}
      />
    </div>
  );
}
