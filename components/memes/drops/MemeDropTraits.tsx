import React, { useState } from "react";

import { ApiDrop } from "../../../generated/models/ApiDrop";
import MemeDropTrait from "./MemeDropTrait";
import { FIELD_TO_LABEL_MAP } from "../../waves/memes/traits/schema";

interface MemeDropTraitsProps {
  readonly drop: ApiDrop;
}

interface MemeDropTrait {
  label: string;
  value: string;
}

const MemeDropTraits: React.FC<MemeDropTraitsProps> = ({ drop }) => {
  const [showAllTraits, setShowAllTraits] = useState(false);

  const artistTrait = drop.metadata.find((md) => md.data_key === "artist");
  const memeNameTrait = drop.metadata.find((md) => md.data_key === "memeName");
  const otherTraits = drop.metadata.filter(
    (md) =>
      ![artistTrait?.data_key, memeNameTrait?.data_key].includes(md.data_key)
  );

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(false);
  };

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(true);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        <MemeDropTrait
          label={FIELD_TO_LABEL_MAP.artist}
          value={artistTrait?.data_value ?? ""}
        />
        <MemeDropTrait
          label={FIELD_TO_LABEL_MAP.memeName}
          value={memeNameTrait?.data_value ?? ""}
        />

        {showAllTraits ? (
          <>
            {otherTraits.map((trait) => (
              <MemeDropTrait
                key={trait.data_key}
                label={
                  FIELD_TO_LABEL_MAP[
                    trait.data_key as keyof typeof FIELD_TO_LABEL_MAP
                  ]
                }
                value={trait.data_value ?? ""}
              />
            ))}
            <button
              onClick={handleShowLess}
              className="tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left"
            >
              Show less
            </button>
          </>
        ) : (
          <button
            onClick={handleShowAll}
            className="tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
};

export default MemeDropTraits;
