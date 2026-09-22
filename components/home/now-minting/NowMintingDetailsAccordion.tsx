"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { printMintDate } from "@/helpers/Helpers";
import MemePageMainStageSubmissionLink from "@/components/the-memes/MemePageMainStageSubmissionLink";
import Link from "next/link";
import { useId, useState } from "react";

interface NowMintingDetailsAccordionProps {
  readonly nftId: number;
  readonly mintDate: Date | undefined;
  readonly fileType?: string | null | undefined;
  readonly dimensions?: string | null | undefined;
  readonly collection: string;
  readonly season: number;
}

export default function NowMintingDetailsAccordion({
  nftId,
  mintDate,
  fileType,
  dimensions,
  collection,
  season,
}: NowMintingDetailsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const details = [
    { label: "Mint date", value: printMintDate(mintDate) },
    ...(fileType ? [{ label: "File type", value: fileType }] : []),
    ...(dimensions ? [{ label: "Dimensions", value: dimensions }] : []),
    { label: "Collection", value: collection },
    { label: "Season", value: `SZN${season}` },
  ];

  return (
    <div>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-50 motion-safe:tw-transition-colors motion-safe:tw-duration-200"
      >
        <span>Edition Details</span>
        <ChevronRightIcon
          aria-hidden="true"
          className={`tw-size-4 motion-safe:tw-transition-transform motion-safe:tw-duration-200 motion-safe:tw-ease-out ${isExpanded ? "tw-rotate-90" : ""}`}
        />
      </button>
      <div
        id={contentId}
        aria-hidden={!isExpanded}
        inert={!isExpanded}
        className={`tw-grid motion-safe:tw-transition-[grid-template-rows,opacity] motion-safe:tw-duration-200 motion-safe:tw-ease-out ${isExpanded ? "tw-grid-rows-[1fr] tw-opacity-100" : "tw-grid-rows-[0fr] tw-opacity-0"}`}
      >
        <div className="tw-min-h-0 tw-overflow-hidden">
          <div className="tw-space-y-3 tw-pt-4 tw-text-sm">
            {details.map(({ label, value }) => (
              <div key={label} className="tw-flex tw-justify-between">
                <span className="tw-text-iron-400">{label}</span>
                <span className="tw-text-iron-200">{value}</span>
              </div>
            ))}
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-iron-400">Distribution Plan</span>
              <Link
                href={`/the-memes/${nftId}/distribution`}
                className="tw-text-iron-200 hover:tw-text-iron-50 motion-safe:tw-transition-colors motion-safe:tw-duration-200"
              >
                View
              </Link>
            </div>
            <MemePageMainStageSubmissionLink
              memeCardId={nftId}
              variant="details-row"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
