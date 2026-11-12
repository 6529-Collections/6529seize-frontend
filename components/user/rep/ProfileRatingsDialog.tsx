"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { AuthContext } from "@/components/auth/Auth";
import { CompactMenu } from "@/components/compact-menu";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import { UserPageIdentityHeaderCICRateForm } from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import { useNicRatingState } from "../identity/header/cic-rate/useNicRatingState";
import UserPageRepModifyForm from "./modify-rep/UserPageRepModifyForm";
import {
  canManageGivenRatings,
  getRatingRecipient,
  withRatingRecipientIdentity,
} from "./ratingsManagement";
import type { RepDirection } from "./UserPageRep.helpers";

type RatingPage = {
  readonly data: ApiRatingWithProfileInfoAndLevel[];
  readonly page: number;
  readonly next: boolean;
};
type Recipient = { readonly identity: string; readonly display: string };
type RatingSelection = {
  readonly recipient: Recipient;
  readonly category: string | null;
};
type RatingListOrder = "rating" | "last_modified";

function RatingLoadState({
  loading,
  error,
  retry,
}: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly retry: () => void;
}) {
  const locale = useBrowserLocale();
  if (error)
    return (
      <div role="alert" className="tw-py-4 tw-text-sm tw-text-iron-300">
        <p>{t(locale, "user.rate.loadError")}</p>
        <Button variant="secondary" size="sm" onClick={retry}>
          {t(locale, "user.rate.retry")}
        </Button>
      </div>
    );
  if (loading)
    return (
      <output className="tw-flex tw-justify-center tw-gap-3 tw-py-6">
        <CircleLoader />
        <span className="tw-sr-only">{t(locale, "user.rate.loading")}</span>
      </output>
    );
  return null;
}

function RecipientRatings({
  recipient,
  owner,
  matter,
  category,
  editCategory,
  onSelectCategory,
  onCancel,
  onSuccess,
  onBusyChange,
}: {
  readonly recipient: Recipient;
  readonly owner: string;
  readonly matter: "REP" | "NIC";
  readonly category: string | null;
  readonly editCategory: string | null;
  readonly onSelectCategory: (category: string) => void;
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
  readonly onBusyChange: (busy: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const target = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: recipient.identity }),
  });
  // Load the allowance alongside identity, then hand the same query to the form.
  const nicRatingState = useNicRatingState(
    recipient.identity,
    matter === "NIC"
  );
  const recipientProfile = target.data
    ? withRatingRecipientIdentity(target.data, recipient.identity)
    : null;
  const categories = useQuery({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      { rater: owner, handleOrWallet: recipient.identity.toLowerCase() },
    ],
    queryFn: () =>
      commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${encodeURIComponent(recipient.identity.toLowerCase())}/rep/ratings/received`,
        params: { rater: owner },
      }),
    enabled: matter === "REP" && !category,
  });
  const loading =
    target.isPending || (matter === "REP" && !category && categories.isPending);
  const error =
    target.isLoadingError ||
    (matter === "REP" && !category && categories.isLoadingError);
  const retry = () => {
    void target.refetch();
    if (matter === "REP" && !category) void categories.refetch();
  };
  const ratings =
    categories.data?.rating_stats.filter(
      (row) => row.rater_contribution !== 0
    ) ?? [];

  if (
    !loading &&
    !error &&
    recipientProfile !== null &&
    editCategory !== null
  ) {
    return (
      <div className="tw-pb-6">
        <UserPageRepModifyForm
          profile={recipientProfile}
          category={editCategory}
          onCancel={onCancel}
          onSuccess={onSuccess}
          onBusyChange={onBusyChange}
        />
      </div>
    );
  }

  return (
    <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
      <RatingLoadState loading={loading} error={error} retry={retry} />
      {!loading && !error && matter === "REP" && (
        <>
          {ratings.length === 0 && (
            <p className="tw-text-sm tw-text-iron-400">
              {t(locale, "user.rate.empty")}
            </p>
          )}
          {ratings.map((row) => (
            <div
              key={row.category}
              className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-py-2"
            >
              <span className="tw-min-w-0 tw-flex-1 tw-break-words tw-text-sm tw-text-iron-100">
                {row.category}
              </span>
              <span className="tw-text-sm tw-text-iron-300">
                {formatInteger(locale, row.rater_contribution)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectCategory(row.category)}
                aria-label={t(locale, "user.rate.adjustCategoryFor", {
                  category: row.category,
                  name: recipient.display,
                })}
              >
                {t(locale, "user.rate.adjust")}
              </Button>
            </div>
          ))}
        </>
      )}
      {!loading && !error && recipientProfile !== null && matter === "NIC" && (
        <UserPageIdentityHeaderCICRateForm
          profile={recipientProfile}
          ratingState={nicRatingState}
          isTooltip={false}
          locale={locale}
          onSuccess={onSuccess}
          onCancel={onCancel}
          onBusyChange={onBusyChange}
        />
      )}
    </div>
  );
}

export default function ProfileRatingsDialog({
  profile,
  matter,
  direction,
  category = null,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly matter: "REP" | "NIC";
  readonly direction: RepDirection;
  readonly category?: string | null;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();
  const canManage =
    (matter === "REP" || !!address) &&
    direction === "given" &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);
  const identity = profile.query ?? profile.handle ?? profile.display;
  const [selectedRating, setSelection] = useState<RatingSelection | null>(null);
  const selection = canManage ? selectedRating : null;
  const [isOpen, setIsOpen] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RatingListOrder>("rating");
  const orderBy = canManage ? selectedOrder : "rating";
  const sortLabel = t(
    locale,
    orderBy === "rating" ? "user.rate.highestFirst" : "user.rate.recentFirst"
  );
  const viewRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const listTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const frame = globalThis.requestAnimationFrame(() => {
      const scroller = viewRef.current?.parentElement;
      if (scroller) scroller.scrollTop = selection ? 0 : listScroll.current;
      if (!selection) listTrigger.current?.focus({ preventScroll: true });
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [selection, orderBy]);

  const close = () => setIsOpen(false);
  const back = () => {
    setIsBusy(false);
    if (matter === "REP" && selection?.category && !category) {
      setSelection({ ...selection, category: null });
    } else {
      setSelection(null);
    }
  };
  const returnAfterSave = () => {
    setIsBusy(false);
    listScroll.current = 0;
    listTrigger.current = null;
    setSelection(null);
  };
  const getListQueryKey = (sort: RatingListOrder) =>
    [
      QueryKey.PROFILE_RATING_LIST,
      {
        identity,
        matter,
        direction,
        category,
        owner: connectedProfile?.id,
        proxy: activeProfileProxy?.id,
        orderBy: sort,
      },
    ] as const;
  const changeOrder = (nextOrder: RatingListOrder) => {
    if (nextOrder === orderBy) return;
    const nextKey = getListQueryKey(nextOrder);
    const cached =
      queryClient.getQueryState<InfiniteData<RatingPage, number>>(nextKey);
    if (cached?.data && cached.data.pages.length > 1) {
      // Reuse page one without refetching every previously loaded page.
      queryClient.setQueryData(
        nextKey,
        {
          ...cached.data,
          pages: cached.data.pages.slice(0, 1),
          pageParams: cached.data.pageParams.slice(0, 1),
        },
        { updatedAt: cached.dataUpdatedAt }
      );
    }
    listScroll.current = 0;
    listTrigger.current = null;
    setSelectedOrder(nextOrder);
  };
  const query = useInfiniteQuery({
    queryKey: getListQueryKey(orderBy),
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<RatingPage>({
        endpoint: `profiles/${encodeURIComponent(identity)}/${matter === "REP" ? "rep" : "cic"}/ratings/by-rater`,
        params: {
          given: String(direction === "given"),
          ...(category ? { category } : {}),
          order_by: orderBy,
          order: "DESC",
          page: String(pageParam),
          page_size: "25",
        },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const directionLabel = t(
    locale,
    direction === "given" ? "user.rate.given" : "user.rate.received"
  );
  let title = t(locale, "user.rate.listTitle", {
    matter,
    direction: directionLabel,
  });
  if (selection) {
    const recipientTitleKey =
      matter === "REP" ? "user.rate.categoriesFor" : "user.rate.adjustFor";
    title =
      selection.category !== null
        ? t(locale, "rep.categories.edit.title", {
            name: selection.recipient.identity,
          })
        : t(locale, recipientTitleKey, {
            matter,
            name: selection.recipient.display,
          });
  }

  return (
    <MobileWrapperDialog
      title={title}
      isOpen={isOpen}
      onClose={close}
      onAfterLeave={onClose}
      onBack={selection ? back : undefined}
      dismissible={!isBusy}
      tabletModal
      desktopAlign="top"
      noPadding
      fitVisualViewport
      enableDragToClose
      focusTitleOnOpen
      maxWidthClass={selection ? "md:tw-max-w-md" : "md:tw-max-w-xl"}
      headerClassName="tw-pb-2 tw-pt-4"
      showScrollbar
    >
      <div ref={viewRef}>
        <div
          hidden={selection !== null}
          className="tw-min-h-24 tw-px-4 tw-pb-6 sm:tw-px-6"
        >
          {category && (
            <p className="tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
              {category}
            </p>
          )}
          {canManage && (
            <div className="tw-my-2 tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
              <span className="tw-shrink-0">
                {t(locale, "user.rate.sortBy")}
              </span>
              <CompactMenu
                aria-label={`${t(locale, "user.rate.sortGiven", { matter })}: ${sortLabel}`}
                className="tw-min-w-0 tw-max-w-full"
                unstyledTrigger
                triggerClassName={`${COMPACT_ACTION_BUTTON_CLASS} tw-min-h-11 tw-min-w-0 tw-max-w-full`}
                trigger={
                  <span
                    className={`${COMPACT_ACTION_CONTENT_CLASS} tw-min-w-0 tw-max-w-full`}
                  >
                    <span className="tw-truncate">{sortLabel}</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="tw-size-3.5 tw-shrink-0"
                    />
                  </span>
                }
                disabled={isBusy}
                activeItemId={orderBy}
                autoFocusItem={false}
                anchor="bottom start"
                menuClassName="tailwind-scope tw-z-[1100]"
                menuWidthClassName="tw-w-64 tw-max-w-[calc(100vw-2rem)]"
                itemClassName="tw-min-h-11"
                items={[
                  {
                    id: "rating",
                    label: t(locale, "user.rate.highestFirst"),
                    onSelect: () => changeOrder("rating"),
                  },
                  {
                    id: "last_modified",
                    label: t(locale, "user.rate.recentFirst"),
                    onSelect: () => changeOrder("last_modified"),
                  },
                ]}
              />
            </div>
          )}
          {!canManage && direction === "given" && (
            <p className="tw-mt-2 tw-text-xs tw-text-iron-400">
              {t(locale, "user.rate.highestFirst")}
            </p>
          )}
          <RatingLoadState
            loading={query.isPending}
            error={query.isLoadingError}
            retry={() => {
              void query.refetch();
            }}
          />
          {query.isSuccess && items.length === 0 && (
            <output className="tw-block tw-py-4 tw-text-sm tw-text-iron-400">
              {t(locale, "user.rate.empty")}
            </output>
          )}
          <ul
            className={`tw-m-0 tw-list-none tw-p-0 ${direction === "received" ? "tw-space-y-3" : ""}`}
          >
            {items.map((row) => {
              const target = getRatingRecipient(row);
              return (
                <li
                  key={row.profile_id}
                  className={`tw-flex tw-min-h-[72px] tw-min-w-0 tw-items-center tw-gap-3 tw-py-3 lg:tw-min-h-0 lg:tw-py-2 ${direction === "received" ? "tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.03] tw-bg-white/[0.02] tw-px-3 tw-transition-colors hover:tw-border-white/5 hover:tw-bg-white/[0.04]" : ""}`}
                >
                  <div className="tw-min-w-0 tw-flex-1 lg:tw-contents">
                    <Link
                      href={`/${encodeURIComponent(target.identity)}`}
                      className="tw-block tw-min-w-0 tw-break-words tw-py-1 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline hover:tw-text-white lg:tw-flex-1 lg:tw-py-2"
                    >
                      {target.display}
                    </Link>
                    <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-shrink-0">
                      <span className="lg:tw-hidden">
                        {t(locale, "user.rate.ratingAmount", {
                          value: formatInteger(locale, row.rating),
                          matter,
                        })}
                      </span>
                      <span className="tw-hidden lg:tw-inline">
                        {formatInteger(locale, row.rating)}
                      </span>
                    </span>
                  </div>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={t(locale, "user.rate.adjustFor", {
                        matter,
                        name: target.display,
                      })}
                      onClick={(event) => {
                        listScroll.current =
                          viewRef.current?.parentElement?.scrollTop ?? 0;
                        listTrigger.current = event.currentTarget;
                        setSelection({ recipient: target, category });
                      }}
                    >
                      {t(locale, "user.rate.adjust")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {query.isFetchNextPageError && (
            <RatingLoadState
              loading={false}
              error
              retry={() => {
                void query.fetchNextPage();
              }}
            />
          )}
          {query.hasNextPage && !query.isFetchNextPageError && (
            <Button
              variant="tertiary"
              size="sm"
              fullWidth
              loading={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage();
              }}
            >
              {t(locale, "user.rate.loadMore")}
            </Button>
          )}
        </div>
        {canManage && selection && (
          <RecipientRatings
            key={selection.recipient.identity}
            recipient={selection.recipient}
            owner={connectedProfile?.handle ?? identity}
            matter={matter}
            category={category}
            editCategory={selection.category}
            onSelectCategory={(selectedCategory) =>
              setSelection({ ...selection, category: selectedCategory })
            }
            onCancel={close}
            onSuccess={returnAfterSave}
            onBusyChange={setIsBusy}
          />
        )}
      </div>
    </MobileWrapperDialog>
  );
}
