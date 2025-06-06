import React, { useState, useMemo } from "react";
import { MEME_TRAITS_SORT_ORDER } from "../memes/traits/schema";
import DropTrait from "./DropTrait";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import {
  faAngleDoubleDown,
  faAngleDoubleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface DropTraitsProps {
  readonly drop: ApiDrop;
  readonly singleWaveDrop?: boolean;
}

export const DropTraits: React.FC<DropTraitsProps> = ({
  drop,
  singleWaveDrop,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const traits = useMemo(() => {
    return drop.metadata.slice().sort((a, b) => {
      const aIndex = MEME_TRAITS_SORT_ORDER.indexOf(a.data_key);
      const bIndex = MEME_TRAITS_SORT_ORDER.indexOf(b.data_key);
      return (
        (aIndex === -1 ? Infinity : aIndex) -
        (bIndex === -1 ? Infinity : bIndex)
      );
    });
  }, [drop]);

  if (traits.length === 0) return null;

  const rowSize = singleWaveDrop ? 3 : 4;
  const previewCount = rowSize - 1;

  const displayedTraits = isExpanded ? traits : traits.slice(0, previewCount);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const content = (
    <>
      {displayedTraits.map((item) => (
        <DropTrait
          key={item.data_key}
          label={item.data_key}
          value={item.data_value}
        />
      ))}
      {traits.length > previewCount && (
        <button
          onClick={toggleExpand}
          className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
          {isExpanded ? (
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <FontAwesomeIcon icon={faAngleDoubleUp} />
              Collapse Traits
            </div>
          ) : (
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <FontAwesomeIcon icon={faAngleDoubleDown} />
              Expand Traits
            </div>
          )}
        </button>
      )}
    </>
  );

  return singleWaveDrop ? (
    <div className="tw-w-full">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-3 tw-gap-2">
        {content}
      </div>
    </div>
  ) : (
    <div className="lg:tw-flex tw-flex-col tw-gap-2 tw-hidden tw-p-4">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {content}
      </div>
    </div>
  );
};

export default DropTraits;
