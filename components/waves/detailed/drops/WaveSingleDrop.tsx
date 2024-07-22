import { useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function WaveSingleDrop({
  dropId,
  availableCredit,
}: {
  readonly dropId: string;
  readonly availableCredit: number | null;
}) {
  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
      }),
  });

  if (!drop) {
    return null;
  }
  return (
    <DropsListItem
      drop={drop}
      showWaveInfo={true}
      availableCredit={availableCredit}
    />
  );
}
