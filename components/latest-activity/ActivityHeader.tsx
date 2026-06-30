"use client";

import Link from "next/link";
import DotLoader from "../dotLoader/DotLoader";

interface ActivityHeaderProps {
  readonly showViewAll: boolean;
  readonly fetching: boolean;
}

export default function ActivityHeader({
  showViewAll,
  fetching,
}: ActivityHeaderProps) {
  return (
    <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-py-2 md:tw-w-1/2">
      <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <h1 className="tw-mb-0">NFT Activity</h1>
        {showViewAll ? (
          <Link href="/nft-activity">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold hover:tw-text-[#bbb] max-[800px]:tw-text-xs">
              View All
            </span>
          </Link>
        ) : (
          fetching && <DotLoader />
        )}
      </span>
    </div>
  );
}
