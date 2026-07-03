"use client";

import { faArrowCircleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import styles from "@/components/nextGen/collections/NextGen.module.css";

interface SlideshowHeaderProps {
  readonly collectionName: string;
}

export default function SlideshowHeader({
  collectionName,
}: SlideshowHeaderProps) {
  return (
    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
      <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-justify-end tw-px-3">
        <Link
          href={`/nextgen/collection/${formatNameForUrl(collectionName)}/art`}
          className={`tw-flex tw-items-center tw-gap-2 tw-no-underline ${styles["viewAllTokens"]}`}
        >
          <h5 className="tw-mb-0 tw-flex tw-items-center tw-gap-2 tw-text-white">
            View All
            <FontAwesomeIcon
              icon={faArrowCircleRight}
              className={styles["viewAllIcon"]}
            />
          </h5>
        </Link>
      </div>
    </div>
  );
}
