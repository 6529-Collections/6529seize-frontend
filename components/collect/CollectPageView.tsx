"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import CollectArtworkCard, {
  type CollectArtworkSelection,
} from "./CollectArtworkCard";
import CollectGoalNavigation from "./CollectGoalNavigation";
import CollectPlanPanel from "./CollectPlanPanel";
import type {
  CollectCatalogView,
  CollectCollection,
  CollectIntent,
  CollectPlanView,
  CollectPlanScenario,
  CollectAcquisitionStrategy,
  CollectProfileView,
  CollectTradeAction,
} from "./collect.types";

const COLLECTIONS = [
  { id: "memes", href: "/the-memes" },
  { id: "gradients", href: "/6529-gradient" },
  { id: "pebbles", href: "/nextgen/collection/pebbles" },
] as const;
export const COLLECT_INTENTS: readonly CollectIntent[] = [
  "lowest",
  "season",
  "full_set",
  "artist",
  "pebbles_set",
  "tdh",
];

interface CollectPageViewProps {
  readonly catalog: CollectCatalogView;
  readonly collection: CollectCollection;
  readonly intent: CollectIntent;
  readonly profile: CollectProfileView | null;
  readonly plan: CollectPlanView | null;
  readonly goalContent?: ReactNode;
  readonly recoveryContent?: ReactNode;
  readonly workspaceContent?: ReactNode;
  readonly workspaceActive?: boolean;
  readonly showCollections?: boolean;
  readonly showListings?: boolean;
  readonly selectionFor?:
    | ((id: string) => CollectArtworkSelection | undefined)
    | undefined;
  readonly selectionSummary?: ReactNode;
  readonly onCollectionChange: (collection: CollectCollection) => void;
  readonly onIntentChange: (intent: CollectIntent) => void;
  readonly onConnect: () => void;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onTrade: (artworkId: string, action: CollectTradeAction) => void;
  readonly onReviewPlan: (planId: string, revision: string) => void;
  readonly onPlanOffers?: (() => void) | undefined;
  readonly onPlanScenarioChange?:
    | ((scenario: CollectPlanScenario) => void)
    | undefined;
  readonly onPlanStrategyChange?:
    | ((strategy: CollectAcquisitionStrategy) => void)
    | undefined;
}

function Listings({
  catalog,
  locale,
  onRetry,
  onLoadMore,
  onTrade,
  selectionFor,
}: Pick<
  CollectPageViewProps,
  "catalog" | "onRetry" | "onLoadMore" | "onTrade" | "selectionFor"
> & { readonly locale: SupportedLocale }) {
  if (catalog.status === "loading") {
    return (
      <div
        role="status"
        aria-label={t(locale, "collect.loading")}
        className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 sm:tw-gap-4"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="tw-aspect-[3/4] tw-rounded-xl tw-bg-iron-900 motion-safe:tw-animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }
  if (catalog.status === "error") {
    return (
      <div
        role="alert"
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-6"
      >
        <p className="tw-text-sm tw-text-iron-300">{catalog.message}</p>
        <Button onClick={onRetry} variant="secondary">
          {t(locale, "collect.retry")}
        </Button>
      </div>
    );
  }
  if (catalog.items.length === 0) {
    return (
      <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-px-6 tw-py-16 tw-text-center">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "collect.listings.empty.title")}
        </h2>
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.listings.empty.description")}
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 sm:tw-gap-4">
        {catalog.items.map((artwork) => (
          <CollectArtworkCard
            key={artwork.id}
            artwork={artwork}
            locale={locale}
            onTrade={onTrade}
            selection={selectionFor?.(artwork.id)}
          />
        ))}
      </div>
      {catalog.hasMore && (
        <div className="tw-mt-6 tw-flex tw-justify-center">
          <Button
            variant="secondary"
            loading={catalog.loadingMore}
            onClick={onLoadMore}
          >
            {t(locale, "collect.loadMore")}
          </Button>
        </div>
      )}
    </>
  );
}

export default function CollectPageView(props: CollectPageViewProps) {
  const locale = useBrowserLocale();
  const collectionLink = COLLECTIONS.find(({ id }) => id === props.collection);
  const showListings =
    props.showListings ?? (props.intent === "lowest" || props.intent === "tdh");
  const contentClass =
    showListings || props.plan ? "tw-max-w-[1080px]" : "tw-max-w-3xl";
  return (
    <div className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-[1440px] tw-px-4 tw-pb-28 tw-pt-6 tw-text-iron-100 md:tw-px-6 lg:tw-px-8">
      <header className="tw-mb-7 tw-space-y-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-2">
          <h1 className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-3xl tw-font-semibold tw-tracking-tight">
            {t(locale, "collect.title")}
          </h1>
          {collectionLink && (
            <Link
              href={collectionLink.href}
              className="tw-inline-flex tw-min-h-11 tw-min-w-11 tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-rounded-lg tw-py-2 tw-text-xs tw-text-iron-300 tw-no-underline hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              <span className="tw-sr-only sm:tw-not-sr-only">
                {t(locale, "collect.viewCollection", {
                  collection: t(
                    locale,
                    `collect.collection.${collectionLink.id}`
                  ),
                })}
              </span>
              <ArrowUpRightIcon className="tw-size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <p className="tw-m-0 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.description")}
        </p>
        {props.profile && (
          <div>
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-primary-300">
              {t(locale, "collect.profileScope", {
                profile: props.profile.displayName,
              })}
            </p>
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.profileScopeDetail")}
            </p>
          </div>
        )}
      </header>
      {props.recoveryContent}
      <CollectGoalNavigation
        intent={props.intent}
        collection={props.collection}
        locale={locale}
        onIntentChange={props.onIntentChange}
      />
      {!props.workspaceActive &&
        props.showCollections !== false &&
        (props.intent === "lowest" || props.intent === "tdh") && (
          <div
            role="group"
            aria-label={t(locale, "collect.collections")}
            className="tw-mb-6 tw-flex tw-flex-wrap tw-gap-2"
          >
            {COLLECTIONS.map(({ id }) => (
              <Button
                key={id}
                variant={props.collection === id ? "primary" : "tertiary"}
                size="sm"
                aria-pressed={props.collection === id}
                onClick={() => props.onCollectionChange(id)}
                className="tw-min-h-11"
              >
                {t(locale, `collect.collection.${id}`)}
              </Button>
            ))}
          </div>
        )}
      <div hidden={!props.workspaceActive} className="tw-max-w-4xl">
        {props.workspaceContent}
      </div>
      <div hidden={props.workspaceActive}>
        <div className={contentClass}>
          <div className="tw-min-w-0">
            {props.goalContent !== undefined && props.goalContent !== null && (
              <div className="tw-mb-6">{props.goalContent}</div>
            )}
            {showListings && (
              <section
                aria-label={t(
                  locale,
                  props.intent === "tdh"
                    ? "collect.intent.tdh"
                    : "collect.navigation.lowest"
                )}
              >
                <Listings
                  catalog={props.catalog}
                  locale={locale}
                  onRetry={props.onRetry}
                  onLoadMore={props.onLoadMore}
                  onTrade={props.onTrade}
                  selectionFor={props.selectionFor}
                />
              </section>
            )}
          </div>
          {props.plan && (
            <div className="tw-mt-8">
              <CollectPlanPanel
                plan={props.plan}
                locale={locale}
                onReview={props.onReviewPlan}
                onPlanOffers={props.onPlanOffers}
                onScenarioChange={props.onPlanScenarioChange}
                onStrategyChange={props.onPlanStrategyChange}
              />
            </div>
          )}
        </div>
        {props.selectionSummary}
      </div>
    </div>
  );
}
