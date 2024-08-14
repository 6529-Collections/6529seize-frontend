import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { QueryKey } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../../../services/api/common-api";
import { Page } from "../../../../../../../helpers/Types";
import { Drop } from "../../../../../../../generated/models/Drop";
import { DropPart } from "../../../../../../../generated/models/DropPart";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../../../../../utils/CommonIntersectionElement";
import DropsListItem from "../../../../item/DropsListItem";

export default function DropPartDiscussionItems({
  drop,
  dropPart,
  dropReplyDepth,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly dropReplyDepth: number;
  readonly availableCredit: number | null;
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
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        page_size: `5`,
      };
      if (pageParam) {
        params.page = `${pageParam}`;
      }
      return await commonApiFetch<Page<Drop>>({
        endpoint: `drops/${drop.id}/parts/${dropPart.part_id}/replies`,
        params,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    enabled: requestAllowed,
  });

  const [replies, setReplies] = useState<Drop[]>([]);
  useEffect(() => {
    setReplies(items?.pages.flatMap((page) => page.data) ?? []);
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
  return (
    <div>
      <div className={`${!isFetching && "tw-overflow-y-auto"}`}>
        <div className="tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700">
          {replies.map((item) => (
            <DropsListItem
              key={item.id}
              drop={{
                ...item,
                reply_to: undefined,
              }}
              replyToDrop={null}
              showWaveInfo={true}
              availableCredit={availableCredit}
              isReply={true}
              dropReplyDepth={dropReplyDepth + 1}
            />
          ))}
        </div>
        <div className="tw-text-center">
          {isFetching && <CircleLoader size={CircleLoaderSize.SMALL} />}
        </div>
        <CommonIntersectionElement onIntersection={onBottomIntersection} />
      </div>
    </div>
  );
}
