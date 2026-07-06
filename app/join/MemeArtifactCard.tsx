import Image from "next/image";

import type { MemeCard } from "./page.content";
import { cx } from "./page.utils";

export function MemeArtifactCard({
  ariaLabel,
  card,
  className,
  fallbackLabel,
  heroMuted = false,
  imageAspectClass = "tw-aspect-[3/4]",
}: {
  readonly ariaLabel: string;
  readonly card: Pick<MemeCard, "image" | "label" | "imageClass" | "number">;
  readonly className?: string;
  readonly fallbackLabel: string;
  readonly heroMuted?: boolean;
  readonly imageAspectClass?: string;
}) {
  const cardNumberLabel =
    card.number === undefined ? fallbackLabel : `#${card.number}`;

  return (
    <div
      aria-label={ariaLabel}
      className={cx(
        "tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-[#08080a] tw-p-1.5 tw-shadow-[0_18px_45px_rgba(0,0,0,0.62),0_0_30px_rgba(255,255,255,0.05)] tw-ring-1 tw-ring-white/[0.03]",
        className
      )}
      role="img"
    >
      <div
        className={cx(
          "tw-relative tw-overflow-hidden tw-rounded-[4px] tw-bg-[#050506]",
          imageAspectClass
        )}
      >
        <Image
          alt=""
          className={cx(
            "tw-h-full tw-w-full tw-object-cover",
            heroMuted && "tw-opacity-90 tw-contrast-[1.05] tw-saturate-[0.95]",
            card.imageClass
          )}
          decoding="async"
          fill
          loading="lazy"
          sizes="(max-width: 640px) 120px, 220px"
          src={card.image}
          unoptimized
        />
        {heroMuted && (
          <>
            <div className="tw-absolute tw-inset-0 tw-bg-[#030303]/20" />
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-white/[0.08] tw-via-transparent tw-to-black/20" />
          </>
        )}
      </div>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-[#070708] tw-px-2 tw-py-1.5">
        <span className="tw-min-w-0 tw-truncate tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-white/70">
          {card.label}
        </span>
        <span className="tw-shrink-0 tw-text-[8px] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300/70">
          {cardNumberLabel}
        </span>
      </div>
    </div>
  );
}
