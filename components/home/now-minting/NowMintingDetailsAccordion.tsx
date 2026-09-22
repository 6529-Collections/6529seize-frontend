"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { printMintDate } from "@/helpers/Helpers";
import MemePageMainStageSubmissionLink from "@/components/the-memes/MemePageMainStageSubmissionLink";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import Link from "next/link";
import styles from "./NowMintingDetailsAccordion.module.css";

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
  const locale = useBrowserLocale();
  const details = [
    {
      label: t(locale, "home.nowMinting.editionDetails.mintDate"),
      value: printMintDate(mintDate),
    },
    ...(fileType
      ? [
          {
            label: t(locale, "home.nowMinting.editionDetails.fileType"),
            value: fileType,
          },
        ]
      : []),
    ...(dimensions
      ? [
          {
            label: t(locale, "home.nowMinting.editionDetails.dimensions"),
            value: dimensions,
          },
        ]
      : []),
    {
      label: t(locale, "home.nowMinting.editionDetails.collection"),
      value: collection,
    },
    {
      label: t(locale, "home.nowMinting.editionDetails.season"),
      value: `SZN${season}`,
    },
  ];

  return (
    <details className={clsx("tw-group", styles["disclosure"])}>
      <summary className="tw-flex tw-min-h-6 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-sm tw-text-sm tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-50 motion-safe:tw-transition-colors motion-safe:tw-duration-200 [&::-webkit-details-marker]:tw-hidden">
        <span>{t(locale, "home.nowMinting.editionDetails.toggle")}</span>
        <ChevronRightIcon
          aria-hidden="true"
          className="tw-size-4 group-open:tw-rotate-90 motion-safe:tw-transition-transform motion-safe:tw-duration-200 motion-safe:tw-ease-out"
        />
      </summary>
      <div className="tw-space-y-3 tw-pt-4 tw-text-sm">
        {details.map(({ label, value }) => (
          <div key={label} className="tw-flex tw-justify-between">
            <span className="tw-text-iron-400">{label}</span>
            <span className="tw-text-iron-200">{value}</span>
          </div>
        ))}
        <div className="tw-flex tw-justify-between">
          <span className="tw-text-iron-400">
            {t(locale, "home.nowMinting.editionDetails.distributionPlan")}
          </span>
          <Link
            href={`/the-memes/${nftId}/distribution`}
            className="tw-text-iron-200 hover:tw-text-iron-50 motion-safe:tw-transition-colors motion-safe:tw-duration-200"
          >
            {t(locale, "home.nowMinting.editionDetails.view")}
          </Link>
        </div>
        <MemePageMainStageSubmissionLink
          memeCardId={nftId}
          variant="details-row"
        />
      </div>
    </details>
  );
}
