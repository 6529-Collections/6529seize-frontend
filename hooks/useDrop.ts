import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
interface UseDropProps {
  readonly dropId: string;
  readonly initialDrop?: ApiDrop;
  readonly enabled?: boolean;
}

const getDropQueryKey = (dropId: string) => [
  QueryKey.DROP,
  {
    drop_id: dropId,
  },
];

const fetchDrop = (dropId: string) =>
  commonApiFetch<ApiDrop>({
    endpoint: `drops/${dropId}`,
  });

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
  } = useQuery<ApiDrop>({
    queryKey: getDropQueryKey(dropId),
    queryFn: () => fetchDrop(dropId),
    initialData: initialDrop,
    placeholderData: keepPreviousData,
    enabled,
  });

  const prefetchDrop = () => {
    queryClient.prefetchQuery({
      queryKey: getDropQueryKey(dropId),
      queryFn: () => fetchDrop(dropId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    drop,
    isFetching,
    prefetchDrop,
    refetch,
  };
};
