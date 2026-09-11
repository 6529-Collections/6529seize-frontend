"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { useId, useState, type ReactNode } from "react";
import CollectArtworkCard from "./CollectArtworkCard";
import CollectPlanPanel from "./CollectPlanPanel";
import type {
  CollectCatalogView,
  CollectCollection,
  CollectIntent,
  CollectPlanView,
  CollectProfileView,
  CollectTradeAction,
} from "./collect.types";

const COLLECTIONS: readonly CollectCollection[] = [
  "all",
  "memes",
  "gradients",
  "pebbles",
];
export const COLLECT_INTENTS: readonly CollectIntent[] = [
  "explore",
  "lowest",
  "specific",
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
  readonly search: string;
  readonly goalContent?: ReactNode;
  readonly onCollectionChange: (collection: CollectCollection) => void;
  readonly onIntentChange: (intent: CollectIntent) => void;
  readonly onSearchChange: (search: string) => void;
  readonly onSearch: () => void;
  readonly onConnect: () => void;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onTrade: (artworkId: string, action: CollectTradeAction) => void;
  readonly onReviewPlan: (planId: string, revision: string) => void;
}

function Catalog({
  catalog,
  locale,
  onRetry,
  onLoadMore,
  onTrade,
}: Pick<
  CollectPageViewProps,
  "catalog" | "onRetry" | "onLoadMore" | "onTrade"
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
          {t(locale, "collect.empty.title")}
        </h2>
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.empty.description")}
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
  const searchId = useId();
  const [planOpen, setPlanOpen] = useState(false);
  return (
    <div className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-[1440px] tw-px-4 tw-pb-28 tw-pt-6 tw-text-iron-100 md:tw-px-6 lg:tw-px-8">
      <header className="tw-mb-7 tw-space-y-3">
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight">
          {t(locale, "collect.title")}
        </h1>
        <p className="tw-m-0 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.description")}
        </p>
        {props.profile ? (
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
        ) : (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.connectDescription")}
            </p>
            <Button variant="secondary" size="sm" onClick={props.onConnect}>
              {t(locale, "collect.connect")}
            </Button>
          </div>
        )}
      </header>
      <div className="tw-mb-6 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <label className="tw-space-y-2 tw-text-xs tw-font-semibold tw-text-iron-300">
          <span>{t(locale, "collect.chooseGoal")}</span>
          <select
            value={props.intent}
            onChange={(event) => {
              const intent = COLLECT_INTENTS.find(
                (value) => value === event.target.value
              );
              if (intent) props.onIntentChange(intent);
            }}
            className="tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {COLLECT_INTENTS.map((intent) => (
              <option key={intent} value={intent}>
                {t(locale, `collect.intent.${intent}`)}
              </option>
            ))}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            props.onSearch();
          }}
          className="tw-space-y-2"
        >
          <label
            htmlFor={searchId}
            className="tw-text-xs tw-font-semibold tw-text-iron-300"
          >
            {t(locale, "collect.search")}
          </label>
          <div className="tw-flex tw-gap-2">
            <input
              id={searchId}
              type="search"
              maxLength={150}
              value={props.search}
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder={t(locale, "collect.searchPlaceholder")}
              className="tw-min-h-11 tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            />
            <Button type="submit" variant="secondary" size="lg">
              {t(locale, "collect.searchSubmit")}
            </Button>
          </div>
        </form>
      </div>
      <div
        role="group"
        aria-label={t(locale, "collect.collections")}
        className="tw-mb-6 tw-flex tw-flex-wrap tw-gap-2"
      >
        {COLLECTIONS.map((collection) => (
          <Button
            key={collection}
            variant={props.collection === collection ? "primary" : "tertiary"}
            size="sm"
            aria-pressed={props.collection === collection}
            onClick={() => props.onCollectionChange(collection)}
            className="tw-min-h-11"
          >
            {t(locale, `collect.collection.${collection}`)}
          </Button>
        ))}
      </div>
      {props.goalContent !== undefined && props.goalContent !== null && (
        <div className="tw-mb-6">{props.goalContent}</div>
      )}
      <div
        className={
          props.plan
            ? "tw-grid tw-items-start tw-gap-6 xl:tw-grid-cols-[minmax(0,1fr)_360px]"
            : "tw-max-w-[1080px]"
        }
      >
        <section
          aria-label={t(locale, "collect.explore")}
          className="tw-min-w-0"
        >
          <Catalog
            catalog={props.catalog}
            locale={locale}
            onRetry={props.onRetry}
            onLoadMore={props.onLoadMore}
            onTrade={props.onTrade}
          />
        </section>
        {props.plan && (
          <aside className="tw-sticky tw-top-5 tw-hidden xl:tw-block">
            <CollectPlanPanel
              plan={props.plan}
              locale={locale}
              onReview={props.onReviewPlan}
            />
          </aside>
        )}
      </div>
      {props.plan && (
        <>
          <div className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-40 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950/95 tw-px-4 tw-pb-[calc(env(safe-area-inset-bottom)+0.75rem)] tw-pt-3 xl:tw-hidden">
            <div className="tw-mx-auto tw-flex tw-max-w-3xl tw-items-center tw-justify-between tw-gap-4">
              <div className="tw-min-w-0">
                <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                  {props.plan.coverageLabel}
                </p>
                <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-semibold tw-tabular-nums">
                  {props.plan.totalLabel ??
                    t(locale, "collect.plan.priceUnavailable")}
                </p>
              </div>
              <Button
                variant="action"
                size="lg"
                onClick={() => setPlanOpen(true)}
              >
                {t(locale, "collect.plan.open")}
              </Button>
            </div>
          </div>
          <MobileWrapperDialog
            title={t(locale, "collect.plan.title")}
            isOpen={planOpen}
            onClose={() => setPlanOpen(false)}
            tabletModal
            hideOnDesktopHover={false}
            enableDragToClose={false}
          >
            <CollectPlanPanel
              plan={props.plan}
              locale={locale}
              onReview={props.onReviewPlan}
            />
          </MobileWrapperDialog>
        </>
      )}
    </div>
  );
}
