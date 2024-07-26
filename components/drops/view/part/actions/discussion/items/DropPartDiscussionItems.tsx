import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { QueryKey } from "../../../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../../../services/api/common-api";
import { Page } from "../../../../../../../helpers/Types";
import { DropComment } from "../../../../../../../generated/models/DropComment";
import { Drop } from "../../../../../../../generated/models/Drop";
import { DropPart } from "../../../../../../../generated/models/DropPart";
import DropPartDiscussionItem from "./DropPartDiscussionItem";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../../../../../utils/CommonIntersectionElement";

export default function DropPartDiscussionItems({
  drop,
  dropPart,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
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
      return await commonApiFetch<Page<DropComment>>({
        endpoint: `drops/${drop.id}/parts/${dropPart.part_id}/comments`,
        params,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    enabled: requestAllowed,
  });

  const [comments, setComments] = useState<DropComment[]>([]);
  useEffect(() => {
    setComments(items?.pages.flatMap((page) => page.data) ?? []);
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
    <div className="tw-pb-2">
      <div className={`${!isFetching && "tw-overflow-y-auto"} tw-max-h-72`}>
        <div>
          {comments.map((item) => (
            <DropPartDiscussionItem key={item.id} item={item} />
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
