import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { SingleWaveDropContentMetadata } from "./SingleWaveDropContentMetadata";

interface MemesSingleWaveDropContentProps {
  readonly drop: ExtendedDrop;
}

export const MemesSingleWaveDropContent: React.FC<
  MemesSingleWaveDropContentProps
> = ({ drop }) => {
  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    drop.title ||
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value || "";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media?.at(0)?.url;

  return (
    <div className="tw-mb-2 tw-flex tw-flex-col">
      {/* Title */}
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-3">
        {title}
      </h3>

      {/* Description if available */}
      {description && (
        <p className="tw-text-iron-300 tw-mb-4 tw-text-md">{description}</p>
      )}

      {/* Full width artwork */}
      <div className="tw-relative tw-bg-iron-900/40 tw-w-full">
        <div className="tw-aspect-video tw-w-full tw-flex tw-items-center tw-justify-center">
          {artworkMedia ? (
            <img
              src={artworkMedia}
              alt={title}
              className="tw-max-w-full tw-max-h-full tw-object-contain"
            />
          ) : (
            <div className="tw-text-center tw-text-iron-400 tw-px-6">
              <FontAwesomeIcon
                icon={faImage}
                className="tw-w-14 tw-h-14 tw-mx-auto tw-mb-3 tw-text-iron-700"
              />
              <p className="tw-text-sm">Artwork preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Show metadata if available */}
      {!!drop.metadata.length && <SingleWaveDropContentMetadata drop={drop} />}
    </div>
  );
};
