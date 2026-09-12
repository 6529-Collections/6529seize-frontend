"use client";

import type { ApiCollectTdhListings } from "@/generated/models/ApiCollectTdhListings";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiCollectTdhTargetPlan } from "@/generated/models/ApiCollectTdhTargetPlan";
import type { ApiCollectDailyTdhPlan } from "@/generated/models/ApiCollectDailyTdhPlan";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import CollectTdhBrowseContext from "./CollectTdhBrowseContext";
import CollectTdhTargetController from "./CollectTdhTargetController";
import CollectTdhDailyWorkspace from "./CollectTdhDailyWorkspace";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import type { CollectCollection } from "./collect.types";

export default function CollectTdhWorkspace({
  profile,
  payingWallet,
  snapshot,
  projection,
  onToggleProjection,
  onConnect,
  onReviewPurchase,
  onPlanOffers,
  onDailyPlanOffers,
  collection,
}: {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly snapshot: ApiCollectTdhListings | undefined;
  readonly projection: boolean;
  readonly onToggleProjection: () => void;
  readonly onConnect: () => void;
  readonly onReviewPurchase: (
    items: readonly CollectSelectedListing[],
    recipient: string
  ) => void;
  readonly onPlanOffers: (plan: ApiCollectTdhTargetPlan) => void;
  readonly onDailyPlanOffers?:
    | ((plan: ApiCollectDailyTdhPlan) => void)
    | undefined;
  readonly collection: CollectCollection;
}) {
  const locale = useBrowserLocale();
  const toggle = useRef<HTMLButtonElement>(null);
  const restoreToggleFocus = useRef(false);
  useEffect(() => {
    if (restoreToggleFocus.current) {
      toggle.current?.focus({ preventScroll: true });
      restoreToggleFocus.current = false;
    }
  }, [projection]);
  return (
    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-4 tw-gap-y-3">
      <div className="tw-col-start-2 tw-row-start-1 tw-flex tw-justify-end">
        <button
          ref={toggle}
          type="button"
          onClick={() => {
            restoreToggleFocus.current = true;
            onToggleProjection();
          }}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-text-iron-300 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {projection && (
            <ArrowLeftIcon className="tw-size-4" aria-hidden="true" />
          )}
          {t(
            locale,
            projection
              ? "collect.tdh.backToListings"
              : "collect.tdhBrowse.target"
          )}
          {!projection && (
            <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {projection ? (
        <div className="tw-col-span-2">
          <CollectTdhTargetController
            profile={profile}
            payingWallet={payingWallet}
            onConnect={onConnect}
            onReviewPurchase={onReviewPurchase}
            onPlanOffers={onPlanOffers}
          />
        </div>
      ) : (
        <div className="tw-col-span-2 tw-min-w-0 tw-space-y-5">
          <CollectTdhDailyWorkspace
            profile={profile}
            payingWallet={payingWallet}
            collection={collection}
            onConnect={onConnect}
            onReviewPurchase={onReviewPurchase}
            onPlanOffers={onDailyPlanOffers}
          />
          <CollectTdhBrowseContext snapshot={snapshot} locale={locale} />
        </div>
      )}
    </div>
  );
}
