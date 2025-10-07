"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/components/auth/Auth";
import XtdhStatsOverview from "./XtdhStatsOverview";
import XtdhCollectionsView, {
  COLLECTIONS_PAGE_SIZE,
  type XtdhCollectionsViewState,
} from "./collections/XtdhCollectionsView";
import XtdhTokensView, {
  TOKENS_PAGE_SIZE,
  type XtdhTokensViewState,
} from "./tokens/XtdhTokensView";
import { useXtdhCollections, useXtdhTokens } from "@/hooks/useXtdhOverview";
import { classNames } from "@/helpers/Helpers";
import UserPageXtdhGrant from "@/components/user/xtdh/UserPageXtdhGrant";

type XtdhView = "collections" | "tokens";

const DEFAULT_COLLECTION_SORT: XtdhCollectionsViewState["sort"] = "total_rate";
const DEFAULT_TOKEN_SORT: XtdhTokensViewState["sort"] = "rate";
const DEFAULT_DIRECTION: "asc" | "desc" = "desc";

function parseView(value: string | null): XtdhView {
  if (!value) return "collections";
  return value === "tokens" ? "tokens" : "collections";
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePage(value: string | null): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDirection(value: string | null): "asc" | "desc" {
  return value?.toLowerCase() === "asc" ? "asc" : "desc";
}

function parseCollectionSort(
  value: string | null
): XtdhCollectionsViewState["sort"] {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase();
  return (["total_rate", "recent", "grantors", "name", "total_allocated"] as const).includes(
    normalized as XtdhCollectionsViewState["sort"]
  )
    ? (normalized as XtdhCollectionsViewState["sort"])
    : DEFAULT_COLLECTION_SORT;
}

function parseTokenSort(value: string | null): XtdhTokensViewState["sort"] {
  if (!value) return DEFAULT_TOKEN_SORT;
  const normalized = value.toLowerCase();
  return (["rate", "recent", "grantors", "name", "collection"] as const).includes(
    normalized as XtdhTokensViewState["sort"]
  )
    ? (normalized as XtdhTokensViewState["sort"])
    : DEFAULT_TOKEN_SORT;
}

function deriveProfileKey(profile: any | null): string | null {
  if (!profile) return null;
  return (
    profile.query ??
    profile.handle ??
    profile.primary_wallet ??
    profile.consolidation_key ??
    null
  );
}

export default function XtdhPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { connectedProfile } = useContext(AuthContext);
  const [showGrantForm, setShowGrantForm] = useState(false);

  const connectedProfileId = useMemo(
    () => deriveProfileKey(connectedProfile),
    [connectedProfile]
  );

  useEffect(() => {
    if (!connectedProfileId && showGrantForm) {
      setShowGrantForm(false);
    }
  }, [connectedProfileId, showGrantForm]);

  const handleGrantFormToggle = useCallback(() => {
    setShowGrantForm((prev) => !prev);
  }, []);

  const view = useMemo(
    () => parseView(searchParams?.get("view") ?? null),
    [searchParams]
  );

  const collectionSort = useMemo(
    () => parseCollectionSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const tokenSort = useMemo(
    () => parseTokenSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const direction = parseDirection(searchParams?.get("dir") ?? null);
  const page = parsePage(searchParams?.get("page") ?? null);
  const networks = parseList(searchParams?.get("network") ?? null);
  const minRate = parseNumber(searchParams?.get("min_rate") ?? null);
  const minGrantors = parseNumber(searchParams?.get("min_grantors") ?? null);
  const showMyGrants = parseBoolean(searchParams?.get("my_grants") ?? null);
  const showMyReceiving = parseBoolean(searchParams?.get("receiving") ?? null);

  const defaultSort =
    view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;

  const activeSort = view === "collections" ? collectionSort : tokenSort;

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      if (!pathname) return;

      const params = new URLSearchParams(searchParams?.toString() ?? "");

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleViewChange = useCallback(
    (nextView: XtdhView) => {
      if (nextView === view) return;

      updateQueryParams({
        view: nextView === "collections" ? null : nextView,
        sort: null,
        dir: null,
        page: "1",
      });
    },
    [updateQueryParams, view]
  );

  const handleSortChange = useCallback(
    (nextSort: string) => {
      const currentDefault =
        view === "collections" ? DEFAULT_COLLECTION_SORT : DEFAULT_TOKEN_SORT;

      const isSame = activeSort === nextSort;
      const nextDirection = isSame
        ? direction === "asc"
          ? "desc"
          : "asc"
        : DEFAULT_DIRECTION;

      updateQueryParams({
        sort: nextSort === currentDefault ? null : nextSort,
        dir: nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
        page: "1",
      });
    },
    [activeSort, direction, updateQueryParams, view]
  );

  const handleDirectionToggle = useCallback(() => {
    const nextDirection = direction === "asc" ? "desc" : "asc";
    updateQueryParams({
      dir: nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
      page: "1",
    });
  }, [direction, updateQueryParams]);

  const handleNetworksChange = useCallback(
    (nextNetworks: string[]) => {
      updateQueryParams({
        network: nextNetworks.length ? nextNetworks.join(",") : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const handleMinRateChange = useCallback(
    (value: number | undefined) => {
      updateQueryParams({
        min_rate:
          typeof value === "number" && Number.isFinite(value) ? value.toString() : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const handleMinGrantorsChange = useCallback(
    (value: number | undefined) => {
      updateQueryParams({
        min_grantors:
          typeof value === "number" && Number.isFinite(value)
            ? value.toString()
            : null,
        page: "1",
      });
    },
    [updateQueryParams]
  );

  const handleToggleMyGrants = useCallback(
    (enabled: boolean) => {
      if (!connectedProfileId) {
        updateQueryParams({ my_grants: null });
        return;
      }

      updateQueryParams({
        my_grants: enabled ? "1" : null,
        page: "1",
      });
    },
    [connectedProfileId, updateQueryParams]
  );

  const handleToggleReceiving = useCallback(
    (enabled: boolean) => {
      if (!connectedProfileId) {
        updateQueryParams({ receiving: null });
        return;
      }

      updateQueryParams({
        receiving: enabled ? "1" : null,
        page: "1",
      });
    },
    [connectedProfileId, updateQueryParams]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      updateQueryParams({ page: nextPage.toString() });
    },
    [updateQueryParams]
  );

  const collectionsQuery = useXtdhCollections({
    sort: view === "collections" ? collectionSort : DEFAULT_COLLECTION_SORT,
    dir: direction,
    page,
    pageSize: COLLECTIONS_PAGE_SIZE,
    networks,
    minRate,
    minGrantors,
    grantorProfileId:
      connectedProfileId && showMyGrants ? connectedProfileId : null,
    holderProfileId:
      connectedProfileId && showMyReceiving ? connectedProfileId : null,
    enabled: view === "collections",
  });

  const tokensQuery = useXtdhTokens({
    sort: view === "tokens" ? tokenSort : DEFAULT_TOKEN_SORT,
    dir: direction,
    page,
    pageSize: TOKENS_PAGE_SIZE,
    networks,
    minRate,
    minGrantors,
    grantorProfileId:
      connectedProfileId && showMyGrants ? connectedProfileId : null,
    holderProfileId:
      connectedProfileId && showMyReceiving ? connectedProfileId : null,
    enabled: view === "tokens",
  });

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhStatsOverview />

      <section
        className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-shadow-inner tw-shadow-black/40 tw-space-y-4"
        aria-label="Allocate xTDH"
      >
        <div className="tw-flex tw-flex-col tw-gap-2 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
          <div>
            <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
              Allocate xTDH
            </h2>
            <p className="tw-text-sm tw-text-iron-300 tw-m-0">
              Grant xTDH to any supported collection or token in the ecosystem.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGrantFormToggle}
            className={classNames(
              "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
              showGrantForm
                ? "tw-bg-iron-800 tw-text-iron-100 hover:tw-bg-iron-700"
                : "tw-bg-primary-500 tw-text-iron-50 hover:tw-bg-primary-400"
            )}
            disabled={!connectedProfileId}
          >
            {showGrantForm ? "Hide Grant Form" : "Allocate xTDH"}
          </button>
        </div>
        {!connectedProfileId && (
          <p className="tw-text-xs tw-text-amber-300 tw-bg-amber-900/20 tw-border tw-border-amber-500/40 tw-rounded-lg tw-px-3 tw-py-2">
            Connect or select a profile to start allocating xTDH.
          </p>
        )}
        {showGrantForm && connectedProfileId && (
          <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 lg:tw-p-6">
            <UserPageXtdhGrant />
          </div>
        )}
      </section>

      <div className="tw-flex tw-flex-col tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
          <div className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800">
            <button
              type="button"
              className={classNames(
                "tw-px-4 tw-py-2 tw-text-sm tw-font-semibold",
                view === "collections"
                  ? "tw-bg-primary-500 tw-text-iron-50"
                  : "tw-bg-transparent tw-text-iron-200 hover:tw-bg-iron-800"
              )}
              onClick={() => handleViewChange("collections")}
              aria-pressed={view === "collections"}
            >
              Collections
            </button>
            <button
              type="button"
              className={classNames(
                "tw-px-4 tw-py-2 tw-text-sm tw-font-semibold",
                view === "tokens"
                  ? "tw-bg-primary-500 tw-text-iron-50"
                  : "tw-bg-transparent tw-text-iron-200 hover:tw-bg-iron-800"
              )}
              onClick={() => handleViewChange("tokens")}
              aria-pressed={view === "tokens"}
            >
              Tokens
            </button>
          </div>
          <p className="tw-text-sm tw-text-iron-300 tw-m-0">
            Discover where xTDH is flowing and how communities allocate influence.
          </p>
        </div>

        {view === "collections" ? (
          <XtdhCollectionsView
            state={{
              sort: collectionSort,
              direction,
              page,
              networks,
              minRate,
              minGrantors,
              showMyGrants,
              showMyReceiving,
            }}
            connectedProfileId={connectedProfileId}
            onSortChange={handleSortChange}
            onDirectionToggle={handleDirectionToggle}
            onNetworksChange={handleNetworksChange}
            onMinRateChange={handleMinRateChange}
            onMinGrantorsChange={handleMinGrantorsChange}
            onToggleMyGrants={handleToggleMyGrants}
            onToggleReceiving={handleToggleReceiving}
            onPageChange={handlePageChange}
            query={collectionsQuery}
          />
        ) : (
          <XtdhTokensView
            state={{
              sort: tokenSort,
              direction,
              page,
              networks,
              minRate,
              minGrantors,
              showMyGrants,
              showMyReceiving,
            }}
            connectedProfileId={connectedProfileId}
            onSortChange={handleSortChange}
            onDirectionToggle={handleDirectionToggle}
            onNetworksChange={handleNetworksChange}
            onMinRateChange={handleMinRateChange}
            onMinGrantorsChange={handleMinGrantorsChange}
            onToggleMyGrants={handleToggleMyGrants}
            onToggleReceiving={handleToggleReceiving}
            onPageChange={handlePageChange}
            query={tokensQuery}
          />
        )}
      </div>
    </div>
  );
}
