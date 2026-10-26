import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";

interface UseDropProps {
  readonly dropId: string;
  readonly initialDrop?: ApiDrop | undefined;
  readonly enabled?: boolean | undefined;
}

export const useDrop = ({
  dropId,
  initialDrop,
  enabled = true,
}: UseDropProps) => {
  const queryClient = useQueryClient();

  const {
    data: drop,
    isFetching,
    refetch,
  } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(dropId),
    queryFn: () => fetchDropByIdBatched(dropId),
    initialData: initialDrop,
    placeholderData: keepPreviousData,
    enabled,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const prefetchDrop = () => {
    void queryClient.prefetchQuery({
      queryKey: getDropQueryKey(dropId),
      queryFn: () => fetchDropByIdBatched(dropId),
      staleTime: DROP_DETAIL_STALE_TIME_MS,
    });
  };

  return {
    drop,
    isFetching,
    prefetchDrop,
    refetch,
  };
};
