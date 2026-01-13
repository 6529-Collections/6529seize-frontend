"use client";

import { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { WaveDropMetaRow } from "@/components/waves/drop/WaveDropMetaRow";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface CarouselActiveItemDetailsProps {
  readonly drop: ExtendedDrop | null;
}

export default function CarouselActiveItemDetails({
  drop,
}: CarouselActiveItemDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!drop) {
    return null;
  }

  const { isWinner } = useDropInteractionRules(drop);
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    drop.title ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ?? "";
  const detailsId = `carousel-details-${drop.id}`;

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col">
      <div className="tw-flex tw-justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          className="tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400 tw-transition hover:tw-text-iron-200"
        >
          <span>{isExpanded ? "Hide details" : "More details"}</span>
          <ChevronDownIcon
            className={`tw-size-4 tw-text-iron-500 tw-transition-transform group-hover:tw-text-iron-300 ${
              isExpanded ? "tw-rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </div>

      {isExpanded && (
        <div id={detailsId} className="tw-mt-6 tw-text-center tw-flex tw-flex-col tw-items-center">
          <div className="tw-mb-4">
            <h1 className="tw-mb-3 tw-text-lg tw-font-bold tw-tracking-tight tw-text-white sm:tw-text-2xl">
              {title}
            </h1>
            {description && (
              <p className="tw-mb-0 tw-text-sm tw-text-white/60 lg:tw-text-md tw-text-balance">
                {description}
              </p>
            )}
          </div>
          <WaveDropMetaRow drop={drop} isWinner={isWinner} />
        </div>
      )}
    </div>
  );
}
