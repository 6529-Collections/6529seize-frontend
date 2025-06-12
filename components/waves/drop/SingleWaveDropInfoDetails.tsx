import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";
import Download, { getFilenameFromUrl } from "../../download/Download";
import { ApiDropType } from "../../../generated/models/ApiDropType";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop }) => {
  const media = drop?.parts?.at(0)?.media?.at(0);
  const filename = getFilenameFromUrl(media?.url);

  return (
    <div className="tw-px-6 tw-space-y-4 tw-pb-6 tw-pt-4">
      {media && filename && (
        <div className="tw-flex tw-justify-between tw-items-center">
          <span className="tw-text-sm tw-font-medium">
            Media Type: {filename.extension.toUpperCase()}
          </span>
          <Download
            href={media.url}
            name={filename.name}
            extension={filename.extension}
          />
        </div>
      )}
      {drop && <SingleWaveDropVoters drop={drop} />}
      {drop && <SingleWaveDropLogs drop={drop} />}
    </div>
  );
};
