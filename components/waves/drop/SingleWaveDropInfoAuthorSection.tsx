import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropAuthor } from "./SingleWaveDropAuthor";
import WaveDropTime from "../drops/time/WaveDropTime";

interface SingleWaveDropInfoAuthorSectionProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoAuthorSection: React.FC<
  SingleWaveDropInfoAuthorSectionProps
> = ({ drop }) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {drop && <SingleWaveDropAuthor drop={drop} />}
      <div className="tw-flex tw-gap-x-2 tw-items-center">
        <div className="tw-w-[3px] tw-h-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
        {drop && <WaveDropTime timestamp={drop.created_at} />}
      </div>
    </div>
  );
};
