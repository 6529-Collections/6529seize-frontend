import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";
import Download, { getFileInfoFromUrl } from "../../download/Download";
import { ApiDropType } from "../../../generated/models/ApiDropType";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop }) => {
  const media = drop?.parts?.at(0)?.media?.at(0);
  const fileInfo = getFileInfoFromUrl(media?.url);
  const title =
    drop?.metadata?.find((m) => m.data_key === "title")?.data_value ??
    drop?.title;
  const author = drop?.author?.handle;
  const wave = drop?.wave.name;
  let fileName = title;
  if (wave) {
    fileName += ` for ${wave}`;
  }
  if (author) {
    fileName += ` by @${author}`;
  }

  return (
    <div className="tw-px-6 tw-space-y-4 tw-pb-6 tw-pt-4">
      {media && fileInfo && (
        <div className="tw-flex tw-justify-between tw-items-center">
          <span className="tw-text-sm tw-font-medium">
            Media Type: {fileInfo.extension.toUpperCase()}
          </span>
          <Download
            href={media.url}
            name={fileName ?? fileInfo.name}
            extension={fileInfo.extension}
          />
        </div>
      )}
      {drop && drop.drop_type !== ApiDropType.Winner && <SingleWaveDropVoters drop={drop} />}
      {drop && <SingleWaveDropLogs drop={drop} />}
    </div>
  );
};
