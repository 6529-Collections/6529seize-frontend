"use client";

import type { ApiCollectTdhListings } from "@/generated/models/ApiCollectTdhListings";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { CollectCollection } from "./collect.types";
import CollectTdhBrowseContext from "./CollectTdhBrowseContext";
import CollectTdhController from "./CollectTdhController";

export default function CollectTdhWorkspace({
  collection,
  profile,
  snapshot,
  projection,
  onToggleProjection,
  onConnect,
}: {
  readonly collection: CollectCollection;
  readonly profile: ApiIdentity | null;
  readonly snapshot: ApiCollectTdhListings | undefined;
  readonly projection: boolean;
  readonly onToggleProjection: () => void;
  readonly onConnect: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-4 tw-gap-y-3">
      <div className="tw-col-start-2 tw-row-start-1 tw-flex tw-justify-end">
        <button
          type="button"
          onClick={onToggleProjection}
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
          <CollectTdhController
            key={collection}
            collection={collection}
            profile={profile}
            onConnect={onConnect}
          />
        </div>
      ) : (
        <div className="tw-col-start-1 tw-row-start-1 tw-min-w-0">
          <CollectTdhBrowseContext snapshot={snapshot} locale={locale} />
        </div>
      )}
    </div>
  );
}
