"use client";

import { ArrowUpLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { getParentWaveName } from "@/helpers/waves/waves.helpers";

interface WaveParentNavigationProps {
  readonly parentWave: ApiWave["parent_wave"];
  readonly variant?: "compact-header" | "detail" | "header" | undefined;
}

export default function WaveParentNavigation({
  parentWave,
  variant = "detail",
}: WaveParentNavigationProps) {
  const parentWaveName = getParentWaveName(parentWave);

  if (!parentWave || !parentWaveName) {
    return null;
  }

  const isCompactHeader = variant === "compact-header";
  const isHeader = variant === "header" || isCompactHeader;

  return (
    <nav
      aria-label="Wave hierarchy"
      className={`tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-4 ${
        isHeader ? "tw-mb-0.5" : ""
      }`}
    >
      <span
        className={
          isHeader
            ? "tw-sr-only"
            : "tw-shrink-0 tw-font-medium tw-text-iron-400"
        }
      >
        Subwave of
      </span>
      <Link
        href={getWavePathRoute(parentWave.id)}
        title={`Open parent wave: ${parentWaveName}`}
        className={`tw-inline-flex tw-min-w-0 tw-shrink tw-items-center tw-gap-x-1 tw-truncate tw-font-medium tw-no-underline tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${
          isCompactHeader ? "tw-max-w-full" : "tw-max-w-[60%]"
        } ${
          isHeader
            ? "desktop-hover:hover:tw-text-primary-200 tw-text-primary-300"
            : "tw-text-iron-300 desktop-hover:hover:tw-text-iron-100"
        }`}
      >
        {isHeader && (
          <ArrowUpLeftIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-shrink-0"
          />
        )}
        <span className="tw-min-w-0 tw-truncate">{parentWaveName}</span>
      </Link>
    </nav>
  );
}
