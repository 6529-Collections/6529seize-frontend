import React, { useContext } from "react";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { AuthContext } from "../../../auth/Auth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";

import WaveDetailedDropQuote from "./WaveDetailedDropQuote";

interface WaveDetailedDropQuoteWithDropIdProps {
  readonly dropId: string;
  readonly partId: number;
  readonly maybeDrop: Drop | null;
  readonly onQuoteClick: (drop: Drop) => void;
}

const WaveDetailedDropQuoteWithDropId: React.FC<
  WaveDetailedDropQuoteWithDropIdProps
> = ({ dropId, partId, maybeDrop, onQuoteClick }) => {
  const { connectedProfile } = useContext(AuthContext);
  const { data: drop } = useQuery<Drop>({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: dropId,
        context_profile: connectedProfile?.profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
        params: connectedProfile?.profile?.handle
          ? { context_profile: connectedProfile.profile.handle }
          : {},
      }),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
  });

  return (
    <WaveDetailedDropQuote
      drop={drop ?? null}
      partId={partId}
      onQuoteClick={onQuoteClick}
    />
  );
};

export default WaveDetailedDropQuoteWithDropId;
