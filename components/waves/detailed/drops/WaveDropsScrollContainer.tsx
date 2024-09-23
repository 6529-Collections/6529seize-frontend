import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React, { forwardRef } from "react";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import WaveDropThreadHeader from "./WaveDropThreadHeader";


interface WaveDropsScrollContainerProps {
  readonly rootDropId: string | null;
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
}

export const WaveDropsScrollContainer = forwardRef<
  HTMLDivElement,
  WaveDropsScrollContainerProps
>(({ children, onScroll, rootDropId }, ref) => {
  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, rootDropId],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `/drops/${rootDropId}`,
      }),
    enabled: !!rootDropId,
    placeholderData: keepPreviousData,
  });
  return (
    <div
      ref={ref}
      className="tw-flex tw-flex-col-reverse tw-flex-grow tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
      onScroll={onScroll}
    >
      <div className="tw-flex tw-flex-col-reverse tw-flex-grow">
        <div className="tw-overflow-hidden">{children}</div>
        {rootDropId && (
          <WaveDropThreadHeader rootDropId={rootDropId} />
        )}
      </div>
    </div>
  );
});

WaveDropsScrollContainer.displayName = "WaveDropsScrollContainer";
