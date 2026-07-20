"use client";

import { faArrowCircleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";

interface SlideshowHeaderProps {
  readonly collectionName: string;
}

export default function SlideshowHeader({
  collectionName,
}: SlideshowHeaderProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-end">
      <Link
        href={`/nextgen/collection/${formatNameForUrl(collectionName)}/art`}
        aria-label={`View all ${collectionName} artwork`}
        className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        View All
        <FontAwesomeIcon
          icon={faArrowCircleRight}
          className="tw-h-5 tw-w-5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
