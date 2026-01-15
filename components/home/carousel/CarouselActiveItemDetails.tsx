"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

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

  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    drop.title ??
    "Untitled";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ?? "";
  const detailsId = `carousel-details-${drop.id}`;
  const author = drop.author;

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-2xl tw-flex-col tw-items-center">
      <span className="tw-mb-2 tw-block tw-text-center tw-text-lg md:tw-text-xl tw-font-semibold tw-text-white">
        {title}
      </span>

      {author && (
        <Link
          href={`/${author.handle}`}
          className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline"
        >
          <span className="tw-text-sm tw-text-iron-400">by</span>
          {author.pfp ? (
            <div className="tw-size-7 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
              <img
                className="tw-max-h-full tw-max-w-full tw-object-cover"
                src={author.pfp}
                alt=""
              />
            </div>
          ) : (
            <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900" />
          )}
          <span className="tw-text-sm tw-font-medium tw-text-iron-300 tw-transition desktop-hover:hover:tw-text-white">
            {author.handle}
          </span>
        </Link>
      )}

      {description && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            className="tw-group tw-mt-3 tw-inline-flex tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-text-xs tw-font-medium tw-text-iron-500 tw-transition hover:tw-text-iron-300"
          >
            <span>{isExpanded ? "Less" : "More"}</span>
            <ChevronDownIcon
              className={`tw-size-3 tw-transition-transform ${
                isExpanded ? "tw-rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          <div
            id={detailsId}
            className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
              isExpanded
                ? "tw-mt-3 tw-grid-rows-[1fr] tw-opacity-100"
                : "tw-grid-rows-[0fr] tw-opacity-0"
            }`}
          >
            <div className="tw-overflow-hidden">
              <p className="tw-max-w-prose tw-text-balance tw-text-center tw-text-base tw-font-normal tw-leading-relaxed tw-text-iron-300">
                {description}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
