import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import type { SupportedLocale } from "@/i18n/locales";

import {
  FOCUS_FEATURE_SPECS,
  SUBMIT_MEME_CARDS,
  THINGS_TO_DO_SPECS,
  type FocusFeatureId,
  type FocusFeatureSpec,
  type JoinLinks,
  type ThingsToDoId,
  type ThingsToDoSpec,
} from "./page.content";
import {
  cx,
  m,
  resolveHref,
  SECONDARY_ACTION_CLASS,
  SECTION_EYEBROW_CLASS,
  TERTIARY_ACTION_CLASS,
} from "./page.utils";
import { BentoWatermark } from "./BentoWatermark";
import { AmbientArtifacts, MemeFan } from "./JoinVisualArtifacts";

const BENTO_PANEL_CLASS =
  "tw-transform tw-rounded-3xl tw-border tw-border-solid tw-border-white/5 tw-border-t-white/10 tw-bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] tw-shadow-[0_30px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] tw-backdrop-blur-[20px] tw-transition-all tw-duration-500 tw-ease-[cubic-bezier(0.16,1,0.3,1)] desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] motion-reduce:tw-transition-none";

const BENTO_HEADING_CLASS =
  "tw-text-[19px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[22px]";
const BENTO_THING_IDS: readonly ThingsToDoId[] = ["delegation", "help"];

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
  const thingTiles = BENTO_THING_IDS.map(getThingToDo);

  return (
    <section className="tw-relative tw-isolate tw-mx-auto tw-w-full tw-max-w-[1088px] tw-overflow-hidden tw-py-12 md:tw-py-16">
      <AmbientArtifacts className="tw-opacity-40" locale={locale} />
      <div className="tw-relative tw-z-10 tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2 lg:tw-grid-cols-12">
        <FeatureCard
          className="lg:tw-col-span-8 lg:tw-h-[328px]"
          feature={nfts}
          links={links}
          locale={locale}
          size="feature"
        >
          <NftCardFan locale={locale} />
        </FeatureCard>
        <FeatureCard
          className="tw-pb-12 sm:tw-pb-14 lg:tw-col-span-4 lg:tw-h-[328px]"
          feature={waves}
          links={links}
          locale={locale}
        >
          <BentoWatermark variant="waves" />
        </FeatureCard>
        <FeatureCard
          className="lg:tw-col-span-6 lg:tw-h-[300px]"
          feature={subscriptions}
          links={links}
          locale={locale}
          size="showcase"
        >
          <BentoWatermark variant="subscriptions" />
        </FeatureCard>
        {thingTiles.map((item) => (
          <ThingCard
            className="lg:tw-col-span-3 lg:tw-h-[300px]"
            item={item}
            key={item.id}
            links={links}
            locale={locale}
          />
        ))}
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
  readonly size?: "compact" | "feature" | "showcase";
}) {
  const actionHref = resolveHref(feature.href, links);
  const hasFanMedia = size === "feature";

  return (
    <article
      className={cx(
        BENTO_PANEL_CLASS,
        "tw-group tw-relative tw-flex tw-overflow-hidden tw-p-7 sm:tw-p-8",
        hasFanMedia && "tw-group/fan",
        hasFanMedia
          ? "tw-flex tw-flex-col tw-gap-8 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
          : "tw-min-h-[190px] tw-flex-col tw-items-start",
        className
      )}
    >
      {hasFanMedia ? (
        <>
          <div className="tw-relative tw-z-10 tw-min-w-0 lg:tw-max-w-[42%]">
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
        <>
          {children}
          <div className="tw-relative tw-z-10 tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-items-start">
            <FeatureCopy feature={feature} locale={locale} size={size} />
            <FeatureAction
              href={actionHref}
              id={feature.id}
              label={m(locale, feature.actionLabelKey)}
            />
          </div>
        </>
      )}
    </article>
  );
}

function ThingCard({
  className,
  item,
  links,
  locale,
}: {
  readonly className?: string;
  readonly item: ThingsToDoSpec;
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
}) {
  return (
    <Link
      className={cx(
        BENTO_PANEL_CLASS,
        "tw-group tw-flex tw-min-h-[190px] tw-flex-col tw-items-start tw-overflow-hidden tw-p-7 tw-no-underline hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/25 sm:tw-p-8",
        className
      )}
      href={resolveHref(item.href, links)}
    >
      <BentoWatermark variant={item.id} />
      <span className={cx("tw-relative tw-z-10", BENTO_HEADING_CLASS)}>
        {m(locale, item.titleKey)}
      </span>
      <span className="tw-relative tw-z-10 tw-mt-4 tw-block tw-max-w-sm tw-text-[15px] tw-font-light tw-leading-relaxed tw-text-iron-500">
        {m(locale, item.bodyKey)}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          TERTIARY_ACTION_CLASS,
          "tw-relative tw-z-10 tw-mt-auto tw-pt-8"
        )}
      >
        {m(locale, item.actionLabelKey)}
        <ArrowRightIcon className="tw-h-3 tw-w-3" />
      </span>
    </Link>
  );
}

function NftCardFan({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-group/fan tw-[perspective:1000px] tw-relative tw-z-10 tw-flex tw-h-[165px] tw-w-full tw-items-center tw-justify-center tw-overflow-visible sm:tw-h-[190px] lg:tw-w-1/2">
      <div className="tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_50%_40%,rgba(132,173,255,0.18),transparent_60%)]" />
      <div className="tw-relative tw-z-10 tw-scale-[0.84] sm:tw-hidden">
        <MemeFan cards={SUBMIT_MEME_CARDS} compact locale={locale} />
      </div>
      <div className="tw-relative tw-z-10 tw-hidden tw-scale-[0.68] sm:tw-block">
        <MemeFan cards={SUBMIT_MEME_CARDS} locale={locale} />
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
  readonly size: "compact" | "feature" | "showcase";
}) {
  return (
    <div className="tw-min-w-0">
      <div
        className={cx(
          "tw-mb-4 tw-flex tw-items-center tw-gap-3",
          size === "showcase" ? "tw-flex-nowrap" : "tw-flex-wrap"
        )}
      >
        <span
          className={cx(
            SECTION_EYEBROW_CLASS,
            "tw-shrink-0 tw-whitespace-nowrap"
          )}
        >
          {m(locale, feature.eyebrowKey)}
        </span>
        {size === "showcase" && (
          <span className="tw-shrink-0 tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
            {m(locale, "join6529.focus.subscriptions.badge")}
          </span>
        )}
      </div>
      <h2 className={BENTO_HEADING_CLASS}>{m(locale, feature.titleKey)}</h2>
      <p
        className={cx(
          "tw-leading-relaxed tw-text-iron-500",
          size === "compact"
            ? "tw-mt-4 tw-text-[15px] tw-font-light"
            : "tw-mt-4 tw-max-w-md tw-text-[15px] tw-font-light",
          size === "showcase" && "tw-mb-2 tw-max-w-xl"
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
        "tw-relative tw-z-10 tw-whitespace-nowrap",
        getActionClass(id)
      )}
      href={href}
    >
      {label}
      {id === "subscriptions" ? (
        <ArrowRightIcon className="tw-h-3 tw-w-3" />
      ) : null}
    </Link>
  );
}

function getActionClass(id: FocusFeatureId) {
  if (id === "subscriptions") {
    return cx("tw-mt-auto tw-pt-8", TERTIARY_ACTION_CLASS);
  }

  if (id === "waves") {
    return cx("tw-mb-5 tw-mt-5 tw-self-start tw-px-6", SECONDARY_ACTION_CLASS);
  }

  return cx("tw-mt-8 tw-self-start tw-px-6", SECONDARY_ACTION_CLASS);
}

function getFocusFeature(id: FocusFeatureId): FocusFeatureSpec {
  const feature = FOCUS_FEATURE_SPECS.find((item) => item.id === id);
  if (!feature) {
    throw new Error(`Missing Join 6529 focus feature: ${id}`);
  }

  return feature;
}

function getThingToDo(id: ThingsToDoId): ThingsToDoSpec {
  const item = THINGS_TO_DO_SPECS.find((thing) => thing.id === id);
  if (!item) {
    throw new Error(`Missing Join 6529 thing to do: ${id}`);
  }

  return item;
}
