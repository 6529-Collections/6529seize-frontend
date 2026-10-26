import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import type { SidebarWave } from "@/types/waves.types";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function HomeWaveCard({
  wave,
  href,
  ariaLabel,
  activity,
  metrics,
}: {
  readonly wave: SidebarWave;
  readonly href: string;
  readonly ariaLabel: string;
  readonly activity: ReactNode;
  readonly metrics: ReactNode;
}) {
  const description = markdownToPlainText(wave.descriptionDrop.contents ?? "", {
    includeImageUrls: false,
    includeLinkDestinations: false,
  });

  return (
    <Link
      data-home-action="Open wave"
      data-wave-card-variant="home"
      href={href}
      prefetch={false}
      aria-label={ariaLabel}
      className="tw-group tw-flex tw-h-full tw-min-h-[248px] tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-950 tw-p-5 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 motion-reduce:tw-transition-none sm:tw-min-h-[264px] sm:tw-p-6"
    >
      <div data-wave-card-header className="tw-flex tw-items-center tw-gap-3">
        <div className="tw-relative tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/10">
          {wave.picture ? (
            <Image
              src={getScaledImageUri(wave.picture, ImageScale.W_200_H_200)}
              alt=""
              fill
              sizes="44px"
              className="tw-object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="tw-text-lg tw-font-semibold tw-text-iron-300"
            >
              {Array.from(wave.name.trim())[0]}
            </span>
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <span className="tw-line-clamp-2 tw-break-words tw-text-[15px] tw-font-semibold tw-leading-5 tw-text-iron-50 tw-transition-colors group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300 motion-reduce:tw-transition-none">
            {wave.name}
          </span>
          {activity}
        </div>
      </div>
      <p
        data-wave-card-preview
        className="tw-mb-6 tw-mt-5 tw-line-clamp-3 tw-break-words tw-text-[15px] tw-font-normal tw-leading-6 tw-text-iron-100"
      >
        {description}
      </p>
      {metrics}
    </Link>
  );
}
