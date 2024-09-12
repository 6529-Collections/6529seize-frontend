import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";

export default function WaveSingleDrop({
  dropId,
  availableCredit,
  isThreaded = false,
}: {
  readonly dropId: string;
  readonly availableCredit: number | null;
  readonly isThreaded?: boolean;
}) {
  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
  });

  if (!drop) {
    return null;
  }

  function onReply(): void {
    throw new Error("Function not implemented.");
  }

  function onQuote(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="tw-px-4 tw-py-2 tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-transition-colors tw-duration-300">
      <div className="tw-flex tw-gap-x-3">
        <WaveDetailedDropAuthorPfp drop={drop} />
        <div className="tw-mt-1 tw-flex tw-flex-col tw-flex-grow">
          <WaveDetailedDropHeader drop={drop} showWaveInfo={false} />

          <div className="tw-mt-0.5">
            <WaveDetailedDropContent drop={drop} />
          </div>

          <WaveDetailedDropActions
            drop={drop}
            onReply={onReply}
            onQuote={onQuote}
          />
          <WaveDetailedDropRatings drop={drop} />
        </div>
      </div>
    </div>
  );
}
