import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";

import type { SupportedLocale } from "@/i18n/locales";

import { MemeArtifactCard } from "./MemeArtifactCard";
import type { MemeCard } from "./page.content";
import { cx, m } from "./page.utils";

const artifactFloatStyle = (
  rotate: string
): CSSProperties & {
  "--hero-rotate": string;
} => ({
  "--hero-rotate": rotate,
});

const COMPACT_SIDE_CARD_CLASS = "tw-w-16 tw-translate-y-3";
const COMPACT_FAN_SIZE_CLASSES = [
  COMPACT_SIDE_CARD_CLASS,
  "tw-w-20",
  COMPACT_SIDE_CARD_CLASS,
  COMPACT_SIDE_CARD_CLASS,
  COMPACT_SIDE_CARD_CLASS,
] as const;

const FAN_SIZE_CLASSES = [
  "tw-w-16 lg:tw-w-24",
  "tw-w-20 lg:tw-w-28",
  "tw-w-28 lg:tw-w-36",
  "tw-w-20 lg:tw-w-28",
  "tw-w-16 lg:tw-w-24",
] as const;

const getFanHoverClass = (index: number, total: number) =>
  index === Math.floor(total / 2)
    ? "desktop-hover:group-hover/fan:tw-scale-105"
    : "desktop-hover:group-hover/fan:-tw-translate-y-4";

export const getMemeCardAriaLabel = (
  card: Pick<MemeCard, "label" | "number">,
  locale: SupportedLocale
) =>
  card.number !== undefined
    ? m(locale, "join6529.visual.memeCardAria", {
        label: card.label,
        number: card.number,
      })
    : m(locale, "join6529.visual.memeCardFallbackAria", {
        label: card.label,
      });

export function AmbientArtifacts({
  className,
  locale,
}: {
  readonly className?: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "tw-pointer-events-none tw-absolute tw-inset-0 tw-hidden tw-overflow-hidden lg:tw-block",
        className
      )}
    >
      <div
        className="tw-absolute -tw-left-12 tw-top-10 tw-w-48 tw-opacity-[0.16] motion-safe:tw-animate-hero-float"
        style={artifactFloatStyle("-8deg")}
      >
        <WaveVisual label={m(locale, "join6529.visual.wave")} />
      </div>
    </div>
  );
}

export function MemeFan({
  cards,
  compact = false,
  locale,
}: {
  readonly cards: readonly MemeCard[];
  readonly compact?: boolean;
  readonly locale: SupportedLocale;
}) {
  const sizeClasses = compact ? COMPACT_FAN_SIZE_CLASSES : FAN_SIZE_CLASSES;
  const fallbackLabel = m(locale, "join6529.visual.memeFallback");

  return (
    <div
      className={cx(
        "tw-flex tw-items-center tw-justify-center",
        compact ? "-tw-space-x-7" : "-tw-space-x-5 lg:-tw-space-x-10"
      )}
    >
      {cards.map((card, index) => (
        <MemeArtifactCard
          ariaLabel={getMemeCardAriaLabel(card, locale)}
          card={card}
          className={cx(
            "tw-shrink-0 tw-transform tw-transition-transform tw-duration-500 tw-ease-out desktop-hover:hover:tw-scale-105 motion-reduce:tw-transition-none",
            card.rotateClass,
            sizeClasses[index] ?? sizeClasses[sizeClasses.length - 1],
            getFanHoverClass(index, cards.length),
            !compact &&
              (index === 0 || index === cards.length - 1) &&
              "tw-translate-y-5",
            !compact && (index === 1 || index === 3) && "tw-translate-y-2"
          )}
          fallbackLabel={fallbackLabel}
          imageAspectClass="tw-aspect-[3/4]"
          key={card.image}
        />
      ))}
    </div>
  );
}

function WaveVisual({ label }: { readonly label: string }) {
  return (
    <div className="tw-relative tw-w-44 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-[#121218]/90 tw-p-3 tw-shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-primary-300/80">
        <ChatBubbleLeftRightIcon className="tw-h-3.5 tw-w-3.5" />
        <span className="tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-wide">
          {label}
        </span>
      </div>
      <div className="tw-space-y-2">
        <div className="tw-h-1.5 tw-w-4/5 tw-rounded-full tw-bg-white/40" />
        <div className="tw-h-1.5 tw-w-3/5 tw-rounded-full tw-bg-white/20" />
      </div>
    </div>
  );
}
