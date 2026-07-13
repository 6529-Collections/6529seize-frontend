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
  SECTION_EYEBROW_CLASS,
  SECTION_HEADING_CLASS,
  TERTIARY_ACTION_CLASS,
  TERTIARY_ACTION_LABEL_CLASS,
} from "./page.utils";
import { BentoWatermark } from "./BentoWatermark";
import { AmbientArtifacts, MemeFan } from "./JoinVisualArtifacts";

const BENTO_PANEL_CLASS =
  "tw-transform tw-rounded-3xl tw-border tw-border-solid tw-border-white/5 tw-border-t-white/10 tw-bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] tw-shadow-[0_30px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] tw-backdrop-blur-[20px] tw-transition-all tw-duration-500 tw-ease-[cubic-bezier(0.16,1,0.3,1)] desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] motion-reduce:tw-transition-none";

const BENTO_HEADING_CLASS =
  "tw-m-0 tw-text-balance tw-text-[17px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[19px] lg:tw-text-[22px]";
const BENTO_THING_HEADING_CLASS =
  "tw-m-0 tw-text-balance tw-text-[16px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[19px] lg:tw-text-[22px]";
const BENTO_THING_IDS: readonly ThingsToDoId[] = ["delegation", "help"];

export function FocusSections({
  links,
  locale,
}: {
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
}) {
  return (
    <section className="tw-relative tw-isolate tw-mx-auto tw-w-full tw-max-w-[1136px] tw-overflow-hidden tw-px-4 tw-py-12 md:tw-py-16 lg:tw-px-6">
      <AmbientArtifacts className="tw-opacity-40" locale={locale} />
      <div className="tw-relative tw-z-10 tw-mb-6 md:tw-mb-7">
        <h2 className={SECTION_HEADING_CLASS}>
          {m(locale, "join6529.focus.heading")}
        </h2>
      </div>
      <div className="tw-relative tw-z-10 tw-grid tw-grid-cols-1 tw-gap-5 sm:tw-grid-cols-2 md:tw-grid-cols-12">
        <FeatureCard
          className="sm:tw-col-span-2 md:tw-col-span-7 lg:tw-col-span-8 lg:tw-min-h-[260px] lg:tw-pb-5 xl:tw-min-h-[300px]"
          feature={getFocusFeature("nfts")}
          links={links}
          locale={locale}
          size="feature"
        >
          <BentoWatermark variant="memes" />
          <NftCardFan locale={locale} />
        </FeatureCard>
        <FeatureCard
          className="sm:tw-col-span-2 md:tw-col-span-5 lg:tw-col-span-4 lg:tw-min-h-[260px] lg:tw-pb-5 xl:tw-min-h-[300px]"
          feature={getFocusFeature("waves")}
          links={links}
          locale={locale}
        >
          <BentoWatermark variant="waves" />
        </FeatureCard>
        <FeatureCard
          className="sm:tw-col-span-2 md:tw-col-span-12 lg:tw-col-span-4 lg:tw-min-h-[260px] xl:tw-col-span-6 xl:tw-min-h-[300px]"
          feature={getFocusFeature("subscriptions")}
          links={links}
          locale={locale}
          size="showcase"
        >
          <BentoWatermark variant="subscriptions" />
        </FeatureCard>
        {BENTO_THING_IDS.map(getThingToDo).map((item) => (
          <ThingCard
            className="sm:tw-col-span-1 md:tw-col-span-6 lg:tw-col-span-4 lg:tw-min-h-[260px] xl:tw-col-span-3 xl:tw-min-h-[300px]"
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
        "tw-group tw-relative tw-flex tw-overflow-hidden tw-p-7 lg:tw-p-8",
        hasFanMedia && "tw-group/fan",
        hasFanMedia
          ? "tw-flex tw-flex-col tw-gap-4 sm:tw-gap-8 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
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
        "tw-group tw-flex tw-min-h-[190px] tw-flex-col tw-items-start tw-overflow-hidden tw-p-7 tw-no-underline hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/25 lg:tw-p-8",
        className
      )}
      href={resolveHref(item.href, links)}
    >
      <BentoWatermark variant={item.id} />
      <h3 className={cx("tw-relative tw-z-10", BENTO_THING_HEADING_CLASS)}>
        {m(locale, item.titleKey)}
      </h3>
      <span className="tw-relative tw-z-10 tw-mt-4 tw-block tw-max-w-[34ch] tw-text-pretty tw-text-[15px] tw-font-light tw-leading-6 tw-text-iron-500">
        {m(locale, item.bodyKey)}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          TERTIARY_ACTION_CLASS,
          "tw-relative tw-z-10 tw-mt-auto tw-pt-8"
        )}
      >
        <span className={TERTIARY_ACTION_LABEL_CLASS}>
          {m(locale, item.actionLabelKey)}
        </span>
        <ArrowRightIcon className="tw-h-3 tw-w-3" />
      </span>
    </Link>
  );
}

function NftCardFan({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div
      aria-hidden="true"
      className="tw-group/fan tw-[perspective:1000px] tw-pointer-events-none tw-relative tw-z-0 tw-flex tw-h-[126px] tw-w-full tw-items-center tw-justify-center tw-overflow-visible sm:tw-absolute sm:tw-bottom-4 sm:tw-right-4 sm:tw-mt-0 sm:tw-h-[124px] sm:tw-w-[250px] md:-tw-right-4 md:tw-h-[118px] md:tw-w-[235px] lg:tw-relative lg:tw-bottom-auto lg:tw-right-auto lg:tw-z-10 lg:tw-h-[190px] lg:tw-w-1/2"
    >
      <div className="tw-absolute -tw-inset-x-12 -tw-inset-y-10 tw-bg-[radial-gradient(ellipse_at_50%_48%,rgba(132,173,255,0.18)_0%,rgba(132,173,255,0.08)_34%,transparent_72%)]" />
      <div className="tw-relative tw-z-10 tw-scale-[0.98] sm:tw-hidden">
        <MemeFan cards={SUBMIT_MEME_CARDS} compact locale={locale} />
      </div>
      <div className="tw-relative tw-z-10 tw-hidden tw-scale-[0.58] sm:tw-block lg:tw-scale-[0.68]">
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
          size === "showcase"
            ? "tw-flex-wrap xl:tw-flex-nowrap"
            : "tw-flex-wrap"
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
      </div>
      <h3 className={BENTO_HEADING_CLASS}>{m(locale, feature.titleKey)}</h3>
      <p
        className={cx(
          "tw-mt-4 tw-max-w-[34ch] tw-text-pretty tw-text-[15px] tw-font-light tw-leading-6 tw-text-iron-500",
          size === "showcase" && "tw-mb-2"
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
      <span className={TERTIARY_ACTION_LABEL_CLASS}>{label}</span>
      <ArrowRightIcon className="tw-h-3 tw-w-3" />
    </Link>
  );
}

function getActionClass(id: FocusFeatureId) {
  if (id === "subscriptions") {
    return cx("tw-mt-auto tw-pt-8", TERTIARY_ACTION_CLASS);
  }

  return cx("tw-mt-5", TERTIARY_ACTION_CLASS);
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
