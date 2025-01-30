import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import React from "react";

export default function WaveDropThreadTraceItem({
  dropId,
  showLine,
}: {
  readonly dropId: string;
  readonly showLine: boolean;
}) {
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
  });

  if (!drop) {
    return null;
  }

  return (
    <React.Fragment key={`trace-pfp-${drop.id}`}>
      <div className="tw-flex-shrink-0 tw-transition-transform tw-duration-300 hover:tw-scale-110">
        {drop.author.pfp ? (
          <img
            src={drop.author.pfp}
            alt={`${drop.author.handle}'s avatar`}
            className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-iron-700 hover:tw-border-iron-500"
          />
        ) : (
          <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-800 hover:tw-bg-iron-700 hover:tw-border-iron-500" />
        )}
      </div>
      {showLine && (
        <div className="tw-flex-shrink-0 tw-w-4 tw-h-[2px] tw-bg-iron-700 tw-self-center tw-transition-colors tw-duration-300 hover:tw-bg-iron-500" />
      )}
    </React.Fragment>
  );
}
