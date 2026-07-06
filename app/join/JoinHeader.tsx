import type { CSSProperties, PointerEvent } from "react";
import Link from "next/link";

import type { SupportedLocale } from "@/i18n/locales";

import { MemeArtifactCard } from "./MemeArtifactCard";
import { HERO_MEME_CARDS } from "./page.content";
import type { CurrentPanelAction, CurrentPanelContent } from "./page.types";
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
  currentPanel,
  isReturningVisitor,
  locale,
}: {
  readonly currentPanel: CurrentPanelContent;
  readonly isReturningVisitor: boolean;
  readonly locale: SupportedLocale;
}) {
  const eyebrowKey = isReturningVisitor
    ? "join6529.hero.eyebrowReturning"
    : "join6529.hero.eyebrow";

  return (
    <header
      className="tw-relative tw-isolate tw-mx-auto tw-flex tw-min-h-[560px] tw-w-full tw-max-w-7xl tw-flex-col tw-items-center tw-justify-center tw-overflow-visible tw-px-0 tw-pb-20 tw-pt-20 md:tw-min-h-[620px] md:tw-pb-28 md:tw-pt-28"
      onPointerLeave={handleHeroPointerLeave}
      onPointerMove={handleHeroPointerMove}
      style={HERO_MAGNETIC_REST_STYLE}
    >
      <HeroFloatPanels locale={locale} />
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-x-8 tw-bottom-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/10 tw-to-transparent"
      />
      <div className="tw-relative tw-z-10 tw-mx-auto tw-mt-4 tw-flex tw-max-w-3xl tw-flex-col tw-items-center tw-text-center">
        <div className="tw-mb-8 tw-inline-flex tw-items-center tw-gap-3 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-4 tw-py-1.5 tw-text-xs tw-font-medium tw-uppercase tw-tracking-widest tw-text-iron-500">
          <span
            aria-hidden="true"
            className="tw-h-1.5 tw-w-1.5 tw-animate-pulse tw-rounded-full tw-bg-iron-400"
          />
          {m(locale, eyebrowKey)}
        </div>
        <h1 className="tw-m-0 tw-text-5xl tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 tw-drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] sm:tw-text-6xl lg:tw-text-7xl">
          {m(locale, "join6529.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-5 tw-max-w-2xl tw-text-pretty tw-text-lg tw-font-light tw-leading-relaxed tw-text-iron-400 lg:tw-text-2xl">
          {m(locale, "join6529.subtitle")}
        </p>
        <div className="tw-mt-12 tw-flex tw-w-full tw-flex-col tw-items-stretch tw-justify-center tw-gap-4 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center">
          {currentPanel.action && (
            <HeroPrimaryAction action={currentPanel.action} />
          )}
          <HeroSecondaryLink
            href="#journey"
            label={m(locale, "join6529.action.explorePaths")}
          />
        </div>
      </div>
    </header>
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
        className="tw-absolute tw-right-[calc(50%+160px)] tw-top-[10%] tw-w-16 tw-opacity-[0.24] tw-blur-[1px] tw-saturate-[0.7] motion-safe:tw-animate-hero-float sm:tw-right-[calc(50%+220px)] sm:tw-w-20 md:tw-right-[calc(50%+300px)] md:tw-top-[8%] md:tw-w-28 lg:tw-right-[calc(50%+360px)] lg:tw-w-32 lg:tw-opacity-25 xl:tw-right-[calc(50%+400px)]"
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
          />
        </div>
      </div>
      <div
        className="tw-absolute tw-right-[calc(50%+130px)] tw-top-[70%] tw-w-16 tw-opacity-40 tw-saturate-[0.78] motion-safe:tw-animate-hero-float sm:tw-right-[calc(50%+190px)] sm:tw-w-24 md:tw-right-[calc(50%+260px)] md:tw-top-[54%] md:tw-w-32 lg:tw-right-[calc(50%+320px)] lg:tw-top-[51%] lg:tw-w-40 lg:tw-opacity-45 xl:tw-right-[calc(50%+350px)]"
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
          />
        </div>
      </div>
      <div
        className="tw-absolute tw-left-[calc(50%+72px)] tw-top-[78%] tw-w-20 tw-opacity-50 tw-saturate-[0.85] motion-safe:tw-animate-hero-float sm:tw-left-[calc(50%+200px)] sm:tw-w-28 md:tw-left-[calc(50%+280px)] md:tw-top-[50%] md:tw-w-36 lg:tw-left-[calc(50%+330px)] lg:tw-top-[49%] lg:tw-w-48 lg:tw-opacity-55 xl:tw-left-[calc(50%+340px)] xl:tw-w-52"
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
          />
        </div>
      </div>
    </div>
  );
}

function HeroPrimaryAction({
  action,
}: {
  readonly action: CurrentPanelAction;
}) {
  const label = action.busy ? (action.busyLabel ?? action.label) : action.label;
  const className =
    "tw-inline-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-8 tw-py-4 tw-text-sm tw-font-medium tw-text-black tw-no-underline tw-shadow-[0_0_30px_rgba(255,255,255,0.1)] tw-transition-colors hover:tw-border-gray-200 hover:tw-bg-gray-200 hover:tw-text-black hover:tw-no-underline focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/70 focus:tw-no-underline disabled:tw-cursor-not-allowed disabled:tw-opacity-70 sm:tw-w-auto";

  if (action.kind === "link" && action.href) {
    const linkProps = {
      ...(action.onClick ? { onClick: action.onClick } : {}),
      ...(action.onNavigate ? { onNavigate: action.onNavigate } : {}),
    };
    return (
      <Link className={className} href={action.href} {...linkProps}>
        {label}
      </Link>
    );
  }

  return (
    <button
      className={className}
      disabled={action.busy}
      onClick={action.onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function HeroSecondaryLink({
  href,
  label,
}: {
  readonly href: string;
  readonly label: string;
}) {
  return (
    <a
      className="tw-inline-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-px-8 tw-py-4 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-50 hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/30 sm:tw-w-auto"
      href={href}
    >
      {label}
    </a>
  );
}
