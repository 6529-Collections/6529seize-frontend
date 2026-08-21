import type { CSSProperties, PointerEvent } from "react";

import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { SupportedLocale } from "@/i18n/locales";

import { HERO_CONTENT, HERO_POINTS } from "./heroContent";
import { MemeArtifactCard } from "./MemeArtifactCard";
import { HERO_MEME_CARDS } from "./page.content";
import type { CurrentPanelAction, JoinPageState } from "./page.types";
import { cx, m } from "./page.utils";
import { getMemeCardAriaLabel } from "./JoinVisualArtifacts";

const heroFloatStyle = (
  rotate: string,
  animationDelay: string
): CSSProperties & {
  "--hero-rotate": string;
} => ({
  "--hero-rotate": rotate,
  animationDelay,
  transform: `rotate(${rotate})`,
});

type HeroMagneticStyle = CSSProperties & {
  "--hero-magnetic-left-x": string;
  "--hero-magnetic-left-y": string;
  "--hero-magnetic-right-x": string;
  "--hero-magnetic-right-y": string;
  "--hero-magnetic-top-x": string;
  "--hero-magnetic-top-y": string;
};

const HERO_MAGNETIC_REST_STYLE: HeroMagneticStyle = {
  "--hero-magnetic-left-x": "0px",
  "--hero-magnetic-left-y": "0px",
  "--hero-magnetic-right-x": "0px",
  "--hero-magnetic-right-y": "0px",
  "--hero-magnetic-top-x": "0px",
  "--hero-magnetic-top-y": "0px",
};

const HERO_MAGNETIC_STRENGTH = {
  x: 8,
  y: 6,
} as const;

const HERO_SUBTITLE_HIGHLIGHT_OPEN = "<highlight>";
const HERO_SUBTITLE_HIGHLIGHT_CLOSE = "</highlight>";

const heroMagneticFrames = new WeakMap<HTMLElement, number>();
const heroMagneticPoints = new WeakMap<
  HTMLElement,
  { readonly x: number; readonly y: number }
>();

function setHeroMagneticOffset(target: HTMLElement, x: number, y: number) {
  target.style.setProperty("--hero-magnetic-left-x", `${x * -0.55}px`);
  target.style.setProperty("--hero-magnetic-left-y", `${y * -0.35}px`);
  target.style.setProperty("--hero-magnetic-right-x", `${x * 0.75}px`);
  target.style.setProperty("--hero-magnetic-right-y", `${y * 0.45}px`);
  target.style.setProperty("--hero-magnetic-top-x", `${x * 0.35}px`);
  target.style.setProperty("--hero-magnetic-top-y", `${y * -0.25}px`);
}

function handleHeroPointerMove(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") {
    return;
  }

  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const x =
    ((event.clientX - rect.left) / rect.width - 0.5) *
    2 *
    HERO_MAGNETIC_STRENGTH.x;
  const y =
    ((event.clientY - rect.top) / rect.height - 0.5) *
    2 *
    HERO_MAGNETIC_STRENGTH.y;

  heroMagneticPoints.set(target, { x, y });

  if (heroMagneticFrames.has(target)) {
    return;
  }

  const frame = globalThis.requestAnimationFrame(() => {
    heroMagneticFrames.delete(target);
    const point = heroMagneticPoints.get(target);
    if (point) {
      setHeroMagneticOffset(target, point.x, point.y);
    }
  });

  heroMagneticFrames.set(target, frame);
}

function handleHeroPointerLeave(event: PointerEvent<HTMLElement>) {
  const target = event.currentTarget;
  const frame = heroMagneticFrames.get(target);
  if (frame !== undefined) {
    globalThis.cancelAnimationFrame(frame);
    heroMagneticFrames.delete(target);
  }

  heroMagneticPoints.delete(target);
  setHeroMagneticOffset(target, 0, 0);
}

export function JoinHeader({
  locale,
  pageState,
  primaryAction,
  secondaryAction,
}: {
  readonly locale: SupportedLocale;
  readonly pageState: JoinPageState;
  readonly primaryAction: CurrentPanelAction;
  readonly secondaryAction: CurrentPanelAction;
}) {
  const heroContent = HERO_CONTENT[pageState];
  const { hasHighlightedSubtitle, subtitleKey } = heroContent;

  return (
    <header
      className="tw-relative tw-isolate tw-z-10 tw-mx-auto tw-flex tw-min-h-[620px] tw-w-full tw-max-w-7xl tw-flex-col tw-items-center tw-justify-center tw-overflow-visible tw-px-4 tw-py-20 md:tw-min-h-[700px] md:tw-px-6 md:tw-py-24 lg:tw-px-8"
      onPointerLeave={handleHeroPointerLeave}
      onPointerMove={handleHeroPointerMove}
      style={HERO_MAGNETIC_REST_STYLE}
    >
      <HeroFloatPanels locale={locale} />
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-x-8 tw-bottom-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/10 tw-to-transparent"
      />
      <div className="tw-relative tw-z-10 tw-mx-auto tw-mt-4 tw-flex tw-w-full tw-max-w-5xl tw-flex-col tw-items-center tw-text-center">
        <div className="tw-mb-6 tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3.5 tw-py-1.5 tw-text-[10px] tw-font-medium tw-uppercase tw-leading-5 tw-tracking-[0.14em] tw-text-iron-400 sm:tw-gap-3 sm:tw-px-4">
          <span
            aria-hidden="true"
            className="tw-h-1.5 tw-w-1.5 tw-animate-pulse tw-rounded-full tw-bg-iron-400"
          />
          {m(locale, heroContent.eyebrowKey)}
        </div>
        <div
          className={cx(
            "tw-flex tw-w-full tw-flex-col tw-items-center",
            hasHighlightedSubtitle ? "tw-max-w-5xl" : "tw-max-w-2xl"
          )}
        >
          <h1 className="tw-m-0 tw-mb-5 tw-text-balance tw-text-4xl tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.035em] tw-text-iron-50 sm:tw-text-[2.5rem] md:tw-text-5xl">
            {m(locale, heroContent.titleKey)}
          </h1>
          {subtitleKey !== undefined && (
            <p className="tw-m-0 tw-text-pretty tw-text-lg tw-font-normal tw-leading-7 tw-text-iron-400 lg:tw-text-xl">
              <HeroSubtitle
                hasHighlight={hasHighlightedSubtitle === true}
                locale={locale}
                subtitleKey={subtitleKey}
              />
            </p>
          )}
        </div>
        <div className="tw-mt-10 tw-flex tw-w-full tw-flex-col tw-items-stretch tw-justify-center tw-gap-4 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center">
          <HeroAction action={primaryAction} variant="primary" />
          <HeroAction action={secondaryAction} variant="secondary" />
        </div>
        <HeroPoints locale={locale} />
      </div>
    </header>
  );
}

function HeroSubtitle({
  hasHighlight,
  locale,
  subtitleKey,
}: {
  readonly hasHighlight: boolean;
  readonly locale: SupportedLocale;
  readonly subtitleKey: Parameters<typeof m>[1];
}) {
  const subtitle = m(locale, subtitleKey);
  if (!hasHighlight) {
    return subtitle;
  }

  const highlightStart = subtitle.indexOf(HERO_SUBTITLE_HIGHLIGHT_OPEN);
  const highlightEnd = subtitle.indexOf(HERO_SUBTITLE_HIGHLIGHT_CLOSE);
  const hasSingleHighlightPair =
    highlightStart >= 0 &&
    highlightStart === subtitle.lastIndexOf(HERO_SUBTITLE_HIGHLIGHT_OPEN) &&
    highlightEnd > highlightStart &&
    highlightEnd === subtitle.lastIndexOf(HERO_SUBTITLE_HIGHLIGHT_CLOSE);
  if (!hasSingleHighlightPair) {
    return subtitle
      .replaceAll(HERO_SUBTITLE_HIGHLIGHT_OPEN, "")
      .replaceAll(HERO_SUBTITLE_HIGHLIGHT_CLOSE, "");
  }

  const highlightedText = subtitle.slice(
    highlightStart + HERO_SUBTITLE_HIGHLIGHT_OPEN.length,
    highlightEnd
  );

  return (
    <>
      {subtitle.slice(0, highlightStart)}
      <span className="tw-inline tw-text-iron-50 md:tw-block">
        {highlightedText}
      </span>
      {subtitle.slice(highlightEnd + HERO_SUBTITLE_HIGHLIGHT_CLOSE.length)}
    </>
  );
}

function HeroPoints({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-relative tw-z-20 tw-mt-20 tw-grid tw-w-full tw-max-w-4xl tw-grid-cols-1 tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-[#030303] tw-pt-8 sm:tw-mt-24 sm:tw-grid-cols-3 sm:tw-gap-0 md:tw-pt-10 lg:tw-mb-12 xl:tw-mb-14">
      {HERO_POINTS.map((point, index) => (
        <div
          className={cx(
            "tw-px-4",
            index > 0 &&
              "sm:tw-border-0 sm:tw-border-l sm:tw-border-solid sm:tw-border-white/10"
          )}
          key={point.titleKey}
        >
          <p className="tw-mb-1.5 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
            {m(locale, point.titleKey)}
          </p>
          <p className="tw-mb-0 tw-text-[15px] tw-font-normal tw-leading-6 tw-text-iron-400">
            {m(locale, point.bodyKey)}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroFloatPanels({ locale }: { readonly locale: SupportedLocale }) {
  const magneticClass =
    "tw-transform-gpu tw-transition-transform tw-duration-200 tw-ease-out motion-reduce:tw-translate-x-0 motion-reduce:tw-translate-y-0 motion-reduce:tw-transition-none";
  const fallbackLabel = m(locale, "join6529.visual.memeFallback");

  return (
    <div
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-1/2 tw-z-0 tw-w-screen -tw-translate-x-1/2 tw-overflow-visible tw-opacity-45 sm:tw-opacity-55 lg:tw-opacity-70"
    >
      <div
        className="tw-absolute tw-hidden tw-opacity-[0.24] tw-blur-[1px] tw-saturate-[0.7] motion-safe:tw-animate-hero-float md:tw-left-[clamp(6rem,12vw,9rem)] md:tw-top-[10%] md:tw-block md:tw-w-28 lg:tw-left-[clamp(10rem,15vw,17rem)] lg:tw-w-32 lg:tw-opacity-25 xl:tw-left-[clamp(13rem,17vw,19rem)] xl:tw-top-[8%]"
        style={heroFloatStyle("8deg", "-2s")}
      >
        <div
          className={cx(
            magneticClass,
            "tw-translate-x-[var(--hero-magnetic-top-x)] tw-translate-y-[var(--hero-magnetic-top-y)]"
          )}
        >
          <MemeArtifactCard
            ariaLabel={getMemeCardAriaLabel(HERO_MEME_CARDS.topLeft, locale)}
            card={HERO_MEME_CARDS.topLeft}
            fallbackLabel={fallbackLabel}
            heroMuted
            imageLoading="eager"
          />
        </div>
      </div>
      <div
        className="tw-absolute tw-hidden tw-opacity-30 tw-saturate-[0.68] motion-safe:tw-animate-hero-float md:tw-right-[calc(50%+13rem)] md:tw-top-[46%] md:tw-block md:tw-w-24 lg:tw-right-[calc(50%+15rem)] lg:tw-top-[40%] lg:tw-w-32 xl:tw-right-[calc(50%+17rem)] xl:tw-top-[32%] xl:tw-w-40 xl:tw-opacity-35"
        style={heroFloatStyle("-6deg", "-4s")}
      >
        <div
          className={cx(
            magneticClass,
            "tw-translate-x-[var(--hero-magnetic-left-x)] tw-translate-y-[var(--hero-magnetic-left-y)]"
          )}
        >
          <MemeArtifactCard
            ariaLabel={getMemeCardAriaLabel(HERO_MEME_CARDS.left, locale)}
            card={HERO_MEME_CARDS.left}
            fallbackLabel={fallbackLabel}
            heroMuted
            imageLoading="eager"
          />
        </div>
      </div>
      <div
        className="tw-absolute tw-hidden tw-opacity-30 tw-saturate-[0.68] motion-safe:tw-animate-hero-float md:tw-left-[calc(50%+200px)] md:tw-top-[15%] md:tw-block md:tw-w-36 lg:tw-left-[calc(50%+260px)] lg:tw-w-48 lg:tw-opacity-35 xl:tw-left-[calc(50%+clamp(18rem,22vw,22rem))] xl:tw-top-[13%] xl:tw-w-52"
        style={heroFloatStyle("5deg", "-5s")}
      >
        <div
          className={cx(
            magneticClass,
            "tw-translate-x-[var(--hero-magnetic-right-x)] tw-translate-y-[var(--hero-magnetic-right-y)]"
          )}
        >
          <MemeArtifactCard
            ariaLabel={getMemeCardAriaLabel(HERO_MEME_CARDS.right, locale)}
            card={HERO_MEME_CARDS.right}
            fallbackLabel={fallbackLabel}
            heroMuted
            imageAspectClass="tw-aspect-[4/3]"
            imageLoading="eager"
          />
        </div>
      </div>
    </div>
  );
}

function HeroAction({
  action,
  variant,
}: {
  readonly action: CurrentPanelAction;
  readonly variant: "primary" | "secondary";
}) {
  const label =
    action.kind === "button" && action.busy
      ? (action.busyLabel ?? action.label)
      : action.label;
  const className = "tw-w-full sm:tw-w-auto";

  if (action.kind === "link") {
    return (
      <ButtonLink
        variant={variant}
        size="lg"
        className={className}
        href={action.href}
        {...(action.onClick ? { onClick: action.onClick } : {})}
        {...(action.onNavigate ? { onNavigate: action.onNavigate } : {})}
      >
        {label}
      </ButtonLink>
    );
  }

  return (
    <Button
      variant={variant}
      size="lg"
      className={className}
      disabled={action.busy}
      loading={action.busy}
      onClick={action.onClick}
    >
      {label}
    </Button>
  );
}
