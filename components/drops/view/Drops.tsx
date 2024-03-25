import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DropFull } from "../../../entities/IDrop";
import { commonApiFetch } from "../../../services/api/common-api";
import DropsList from "./DropsList";

export default function Drops() {
  const {
    isLoading,
    isFetching,
    data: drops,
  } = useQuery<DropFull[]>({
    queryKey: ["latest-drops"],
    queryFn: async () =>
      await commonApiFetch<DropFull[]>({
        endpoint: `drops/latest`,
      }),
    placeholderData: keepPreviousData,
  });

  return <div>{drops?.length && <DropsList drops={drops} />}</div>;
}
