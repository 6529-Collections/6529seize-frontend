"use client";

import { ChevronRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type WaveChipProps = {
  readonly name: string;
  readonly picture: string | null;
  readonly isPrivate?: boolean;
  readonly showChevron?: boolean;
  readonly className?: string;
} & (
  | {
      readonly href: string;
      readonly onClick?: never;
      readonly ariaLabel?: never;
    }
  | {
      readonly onClick: () => void;
      readonly ariaLabel: string;
      readonly href?: never;
    }
);

const WAVE_CHIP_CLASS_NAME =
  "tw-group tw-inline-flex tw-h-9 tw-max-w-[14rem] tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-1 tw-pr-3 tw-no-underline tw-shadow-sm tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] motion-reduce:tw-transition-none";

export default function WaveChip({
  name,
  picture,
  isPrivate = false,
  showChevron = false,
  href,
  onClick,
  ariaLabel,
  className,
}: WaveChipProps) {
  const locale = useBrowserLocale();
  const imageSrc = picture
    ? getScaledImageUri(picture, ImageScale.W_200_H_200)
    : null;
  const content = (
    <>
      <div className="tw-relative tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 tw-shadow-sm tw-transition-colors desktop-hover:group-hover:tw-border-white/[0.1]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="28px"
            className="tw-object-cover"
          />
        ) : (
          <WavesIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-300" />
        )}
      </div>
      {isPrivate && (
        <>
          <LockClosedIcon
            aria-hidden="true"
            className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/40"
          />
          <span className="tw-sr-only">
            {t(locale, "user.brain.sidebar.privateWave")}
          </span>
        </>
      )}
      <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors desktop-hover:group-hover:tw-text-iron-100">
        {name}
      </span>
      {showChevron && (
        <ChevronRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-400"
        />
      )}
    </>
  );
  if (href !== undefined) {
    return (
      <Link
        href={href}
        prefetch={false}
        className={clsx(WAVE_CHIP_CLASS_NAME, className)}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={name}
      onClick={onClick}
      className={clsx(WAVE_CHIP_CLASS_NAME, className)}
    >
      {content}
    </button>
  );
}
