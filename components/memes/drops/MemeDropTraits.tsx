"use client";

import React, { useState } from "react";

import { ApiDrop } from "@/generated/models/ApiDrop";
import MemeDropTrait from "./MemeDropTrait";
import {
  FIELD_TO_LABEL_MAP,
  MEME_TRAITS_SORT_ORDER,
} from "@/components/waves/memes/traits/schema";

interface MemeDropTraitsProps {
  readonly drop: ApiDrop;
}

interface MemeDropTrait {
  label: string;
  value: string;
}

const MemeDropTraits: React.FC<MemeDropTraitsProps> = ({ drop }) => {
  const [showAllTraits, setShowAllTraits] = useState(false);

  const traits = drop.metadata.sort((a, b) => {
    const aIndex = MEME_TRAITS_SORT_ORDER.indexOf(a.data_key);
    const bIndex = MEME_TRAITS_SORT_ORDER.indexOf(b.data_key);
    return aIndex - bIndex;
  });

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(false);
  };

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(true);
  };

  return (
    <div className="lg:tw-flex tw-flex-col tw-gap-2 tw-hidden tw-p-4">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {traits.slice(0, 2).map((trait) => (
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

        {showAllTraits ? (
          <>
            {traits.slice(2).map((trait) => (
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
              className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
              Show less
            </button>
          </>
        ) : (
          <button
            onClick={handleShowAll}
            className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
            Show all
          </button>
        )}
      </div>
    </div>
  );
};

export default MemeDropTraits;
