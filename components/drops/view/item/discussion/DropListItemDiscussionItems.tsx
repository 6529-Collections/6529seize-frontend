import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import DropListItemDiscussionItemsItem from "./item/DropListItemDiscussionItemsItem";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { DropActivityLog, DropFull } from "../../../../../entities/IDrop";
import { Page } from "../../../../../helpers/Types";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { DropItemDiscussionFilterType } from "./DropListItemDiscussion";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import DropListWrapperBottomTrigger from "../../DropListWrapperBottomTrigger";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../distribution-plan-tool/common/CircleLoader";
import { ProfileActivityLogType } from "../../../../../entities/IProfile";

export default function DropListItemDiscussionItems({
  drop,
  filter,
  animating,
}: {
  readonly drop: DropFull;
  readonly filter: DropItemDiscussionFilterType;
  readonly animating: boolean;
}) {
  const [requestAllowed, setRequestAllowed] = useState(false);
  useDebounce(() => setRequestAllowed(!animating), 300, [animating]);

  const {
    data: items,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.DROP_DISCUSSION,
      {
        drop_id: drop.id,
        log_type: filter,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        page_size: `5`,
      };
      if (pageParam) {
        params.page = `${pageParam}`;
      }
      if (filter) {
        params.log_type = filter;
      }
      return await commonApiFetch<Page<DropActivityLog>>({
        endpoint: `drops/${drop.id}/log`,
        params,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    enabled: requestAllowed,
  });

  const getNoItemsMessage = () => {
    switch (filter) {
      case "DROP_COMMENT":
        return "No comments to display";
      case "DROP_REP_EDIT":
        return "No reputation edits to display";
      default:
        return "No logs to display";
    }
  };

  const [logs, setLogs] = useState<DropActivityLog[]>([]);
  useEffect(() => {
    setLogs(items?.pages.flatMap((page) => page.data) ?? []);
  }, [items]);

  const onBottomIntersection = (state: boolean) => {
    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }

    fetchNextPage();
  };

  if (!requestAllowed || !items) {
    return <></>;
  }

  return (
    <div className="tw-space-y-4">
      <div className="tw-max-h-72 tw-overflow-y-auto">
        <div className="tw-space-y-4">
          {logs.map((item) => (
            <DropListItemDiscussionItemsItem key={item.id} item={item} />
          ))}
        </div>
        <div className="tw-text-center">
          {isFetching && <CircleLoader size={CircleLoaderSize.SMALL} />}
        </div>
        <DropListWrapperBottomTrigger
          onBottomIntersection={onBottomIntersection}
        />
      </div>
      {!logs.length && (
        <span className="tw-text-sm sm:tw-text-md tw-italic tw-text-iron-500">
          {getNoItemsMessage()}
        </span>
      )}
    </div>
  );
}
