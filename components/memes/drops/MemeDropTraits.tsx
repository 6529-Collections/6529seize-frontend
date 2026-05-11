"use client";

import React, { useState } from "react";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import MemeDropTrait from "./MemeDropTrait";
import {
  FIELD_TO_LABEL_MAP,
  MEME_TRAITS_SORT_ORDER,
} from "@/components/waves/memes/traits/schema";
import { MEMES_SUBMISSION_ADDITIONAL_INFO_KEYS } from "@/components/waves/memes/submission/types/OperationalData";

interface MemeDropTraitsProps {
  readonly drop: ApiDrop;
}

interface MemeDropTrait {
  label: string;
  value: string;
}

const MemeDropTraits: React.FC<MemeDropTraitsProps> = ({ drop }) => {
  const [showAllTraits, setShowAllTraits] = useState(false);

  const traits = drop.metadata
    .filter((i) => !MEMES_SUBMISSION_ADDITIONAL_INFO_KEYS.includes(i.data_key))
    .sort((a, b) => {
      const aIndex = MEME_TRAITS_SORT_ORDER.indexOf(a.data_key);
      const bIndex = MEME_TRAITS_SORT_ORDER.indexOf(b.data_key);
      return aIndex - bIndex;
    });
  const hasHiddenTraits = traits.length > 2;

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(false);
  };

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTraits(true);
  };

  if (!traits.length) {
    return null;
  }

  const traitToggle = (() => {
    if (showAllTraits) {
      return (
        <button
          onClick={handleShowLess}
          className="tw-cursor-pointer tw-self-end tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-pb-1.5 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
        >
          Show less
        </button>
      );
    }

    if (!hasHiddenTraits) {
      return null;
    }

    return (
      <button
        onClick={handleShowAll}
        className="tw-cursor-pointer tw-self-end tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-pb-1.5 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
      >
        Show all
      </button>
    );
  })();

  return (
    <div className="tw-hidden tw-flex-col tw-gap-2 lg:tw-flex">
      <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
        {traits.slice(0, 2).map((trait) => (
          <MemeDropTrait
            key={trait.data_key}
            label={
              FIELD_TO_LABEL_MAP[
                trait.data_key as keyof typeof FIELD_TO_LABEL_MAP
              ]
            }
            value={trait.data_value ?? ""}
            dropId={drop.id}
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
                dropId={drop.id}
              />
            ))}
            {traitToggle}
          </>
        ) : (
          traitToggle
        )}
      </div>
    </div>
  );
};

export default MemeDropTraits;
