import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { useEffect, useState } from "react";

export default function WaveSingleDrop({
  dropId,
  availableCredit,
}: {
  readonly dropId: string;
  readonly availableCredit: number | null;
}) {
  const [activePartIndex, setActivePartIndex] = useState(0);

  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => console.log(drop), [drop]);

  if (!drop) {
    return null;
  }

  return (
    <div className="tw-px-4 tw-py-2 tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-transition-colors tw-duration-300">
      <div className="tw-flex tw-gap-x-3">
        <WaveDetailedDropAuthorPfp drop={drop} />
        <div className="tw-mt-1 tw-flex tw-flex-col tw-flex-grow">
          <WaveDetailedDropHeader
            drop={drop}
            showWaveInfo={false}
            isStorm={drop.parts.length > 1}
            currentPartIndex={activePartIndex}
            partsCount={drop.parts.length}
          />

          <div className="tw-mt-0.5">
            <WaveDetailedDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
            />
          </div>
          {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
        </div>
      </div>
    </div>
  );
}
