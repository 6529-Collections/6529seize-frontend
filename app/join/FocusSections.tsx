import Link from "next/link";
import type { ReactNode } from "react";
import { BoltIcon } from "@heroicons/react/24/solid";

import WavesIcon from "@/components/common/icons/WavesIcon";
import type { SupportedLocale } from "@/i18n/locales";

import {
  FOCUS_FEATURE_SPECS,
  MEME_CARDS,
  type FocusFeatureId,
  type FocusFeatureSpec,
  type JoinLinks,
} from "./page.content";
import { cx, m, resolveHref, SECTION_EYEBROW_CLASS } from "./page.utils";
import { AmbientArtifacts, MemeFan } from "./JoinVisualArtifacts";

const BENTO_PANEL_CLASS =
  "tw-transform tw-rounded-3xl tw-border tw-border-solid tw-border-white/5 tw-border-t-white/10 tw-bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] tw-shadow-[0_30px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] tw-backdrop-blur-[20px] tw-transition-all tw-duration-500 tw-ease-[cubic-bezier(0.16,1,0.3,1)] desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] motion-reduce:tw-transition-none";

const BENTO_HEADING_CLASS =
  "tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white sm:tw-text-[26px]";

const OUTLINE_ACTION_CLASS =
  "tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-px-6 tw-py-3 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-white/5 focus:tw-ring-white/25";

export function FocusSections({
  links,
  locale,
}: {
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
}) {
  const subscriptions = getFocusFeature("subscriptions");
  const waves = getFocusFeature("waves");
  const nfts = getFocusFeature("nfts");

  return (
    <section className="tw-relative tw-isolate tw-mx-auto tw-w-full tw-max-w-7xl tw-overflow-hidden tw-px-6 tw-py-32">
      <AmbientArtifacts className="tw-opacity-40" />
      <div className="tw-relative tw-z-10 tw-grid tw-grid-cols-1 tw-gap-6 md:tw-auto-rows-fr md:tw-grid-cols-3">
        <FeatureCard
          className="md:tw-col-span-2"
          feature={subscriptions}
          links={links}
          locale={locale}
          size="large"
        >
          <SubscriptionAccent />
        </FeatureCard>
        <FeatureCard feature={waves} links={links} locale={locale}>
          <WavesAccent />
        </FeatureCard>
        <FeatureCard
          className="md:tw-col-span-3"
          feature={nfts}
          links={links}
          locale={locale}
          size="wide"
        >
          <NftCardFan />
        </FeatureCard>
      </div>
    </section>
  );
}

function FeatureCard({
  children,
  className,
  feature,
  links,
  locale,
  size = "compact",
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly feature: FocusFeatureSpec;
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
  readonly size?: "compact" | "large" | "wide";
}) {
  const actionHref = resolveHref(feature.href, links);

  return (
    <article
      className={cx(
        BENTO_PANEL_CLASS,
        "tw-group tw-relative tw-overflow-hidden tw-p-10",
        size === "wide" && "tw-group/fan",
        size === "wide"
          ? "tw-flex tw-flex-col tw-items-center tw-gap-12 md:tw-flex-row"
          : "tw-flex tw-flex-col tw-justify-between",
        className
      )}
    >
      {size === "wide" ? (
        <>
          <div className="tw-relative tw-z-10 tw-min-w-0 md:tw-w-1/2">
            <FeatureCopy feature={feature} locale={locale} size={size} />
            <FeatureAction
              href={actionHref}
              id={feature.id}
              label={m(locale, feature.actionLabelKey)}
            />
          </div>
          {children}
        </>
      ) : (
        <div className="tw-relative tw-z-10 tw-min-w-0">
          <FeatureCopy feature={feature} locale={locale} size={size} />
          {children}
          <FeatureAction
            href={actionHref}
            id={feature.id}
            label={m(locale, feature.actionLabelKey)}
          />
        </div>
      )}
    </article>
  );
}

function SubscriptionAccent() {
  return (
    <>
      <div className="tw-pointer-events-none tw-absolute -tw-bottom-20 -tw-right-40 tw-transform tw-opacity-[0.08] tw-transition-opacity tw-duration-700 tw-ease-out desktop-hover:group-hover:tw-opacity-[0.18] motion-reduce:tw-transition-none">
        <BoltIcon
          aria-hidden="true"
          className="tw-h-[300px] tw-w-[300px] tw-text-[#7000ff]"
        />
      </div>
      <div className="tw-relative tw-z-10 tw-mt-6 tw-flex tw-flex-wrap tw-gap-3">
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-px-3 tw-py-1 tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-widest tw-text-white/60">
          Remote minting
        </span>
      </div>
    </>
  );
}

function WavesAccent() {
  return (
    <WavesIcon
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute -tw-right-32 -tw-top-14 tw-h-[220px] tw-w-[220px] tw-text-[#00f0ff] tw-opacity-[0.06] tw-transition-opacity tw-duration-700 tw-ease-out desktop-hover:group-hover:tw-opacity-[0.18] motion-reduce:tw-transition-none"
    />
  );
}

function NftCardFan() {
  return (
    <div className="tw-group/fan tw-[perspective:1000px] tw-relative tw-z-10 tw-flex tw-h-[300px] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden md:tw-w-1/2">
      <div className="tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_50%_40%,rgba(132,173,255,0.18),transparent_60%)]" />
      <div className="tw-relative tw-z-10 sm:tw-hidden">
        <MemeFan cards={MEME_CARDS.slice(0, 5)} compact />
      </div>
      <div className="tw-relative tw-z-10 tw-hidden sm:tw-block">
        <MemeFan cards={MEME_CARDS.slice(0, 5)} />
      </div>
    </div>
  );
}

function FeatureCopy({
  feature,
  locale,
  size,
}: {
  readonly feature: FocusFeatureSpec;
  readonly locale: SupportedLocale;
  readonly size: "compact" | "large" | "wide";
}) {
  return (
    <div className="tw-min-w-0">
      <span className={cx("tw-mb-4 tw-block", SECTION_EYEBROW_CLASS)}>
        {m(locale, feature.eyebrowKey)}
      </span>
      <h2 className={BENTO_HEADING_CLASS}>{m(locale, feature.titleKey)}</h2>
      <p
        className={cx(
          "tw-leading-relaxed tw-text-white/[0.45]",
          size === "compact"
            ? "tw-mt-4 tw-text-[15px] tw-font-light"
            : "tw-mt-4 tw-max-w-md tw-text-[15px] tw-font-light",
          size === "wide" && "tw-mb-8 tw-max-w-lg"
        )}
      >
        {m(locale, feature.bodyKey)}
      </p>
    </div>
  );
}

function FeatureAction({
  href,
  id,
  label,
}: {
  readonly href: string;
  readonly id: FocusFeatureId;
  readonly label: string;
}) {
  return (
    <Link
      className={cx(
        "tw-relative tw-z-10 tw-inline-flex tw-cursor-pointer tw-whitespace-nowrap tw-no-underline tw-transition-colors hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus:tw-ring-2",
        getActionClass(id)
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

function getActionClass(id: FocusFeatureId) {
  if (id === "subscriptions") {
    return "tw-mt-10 tw-rounded-lg tw-border tw-border-solid tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/10 tw-px-6 tw-py-3 tw-text-sm tw-font-medium tw-text-[#00f0ff] hover:tw-bg-[#00f0ff]/20 hover:tw-text-[#00f0ff] focus:tw-ring-[#00f0ff]/30";
  }

  if (id === "waves") {
    return `tw-mt-8 tw-self-start ${OUTLINE_ACTION_CLASS}`;
  }

  return OUTLINE_ACTION_CLASS;
}

function getFocusFeature(id: FocusFeatureId): FocusFeatureSpec {
  const feature = FOCUS_FEATURE_SPECS.find((item) => item.id === id);
  if (!feature) {
    throw new Error(`Missing Join 6529 focus feature: ${id}`);
  }

  return feature;
}
