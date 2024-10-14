import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { QueryKey } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../../../services/api/common-api";
import { Page } from "../../../../../../../helpers/Types";
import { ApiDrop } from "../../../../../../../generated/models/ApiDrop";
import { ApiDropPart } from "../../../../../../../generated/models/ApiDropPart";
import CommonIntersectionElement from "../../../../../../utils/CommonIntersectionElement";
import DropsListItem, {
  DropConnectingLineType,
} from "../../../../item/DropsListItem";
import { getDropKey } from "../../../../../../../helpers/waves/drop.helpers";

export default function DropPartDiscussionItems({
  drop,
  dropPart,
  dropReplyDepth,
  availableCredit,
  activeDiscussionDropId,
  showWaveInfo = true,
  setActiveDiscussionDropId,
  setRepliesOpen,
}: {
  readonly drop: ApiDrop;
  readonly dropPart: ApiDropPart;
  readonly dropReplyDepth: number;
  readonly availableCredit: number | null;
  readonly activeDiscussionDropId: string | null;
  readonly showWaveInfo?: boolean;
  readonly setActiveDiscussionDropId: (id: string | null) => void;
  readonly setRepliesOpen: (state: boolean) => void;
}) {
  const animating = false;
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
        drop_part_id: dropPart.part_id,
        sort_direction: "ASC",
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        page_size: `5`,
        sort_direction: "ASC",
      };
      if (pageParam) {
        params.page = `${pageParam}`;
      }
      return await commonApiFetch<Page<ApiDrop>>({
        endpoint: `drops/${drop.id}/parts/${dropPart.part_id}/replies`,
        params,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    placeholderData: keepPreviousData,
    enabled: requestAllowed,
  });

  const [replies, setReplies] = useState<ApiDrop[]>([]);
  useEffect(() => {
    const results = items?.pages.flatMap((page) => page.data) ?? [];
    if (!activeDiscussionDropId) {
      setReplies(results);
      setRepliesOpen(false);
      return;
    }
    setReplies(results.filter((item) => item.id === activeDiscussionDropId));
    setRepliesOpen(true);
  }, [items, activeDiscussionDropId]);

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

  return (
    <div>
      <div>
        {replies.map((item, i) => (
          <DropsListItem
            key={getDropKey({
              drop: item,
              returnOriginal: i !== replies.length - 1,
            })}
            drop={item}
            replyToDrop={null}
            showWaveInfo={showWaveInfo}
            availableCredit={availableCredit}
            isReply={true}
            dropReplyDepth={activeDiscussionDropId ? 1 : dropReplyDepth + 1}
            connectingLineType={DropConnectingLineType.FULL}
            onDiscussionStateChange={setActiveDiscussionDropId}
          />
        ))}
      </div>
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
