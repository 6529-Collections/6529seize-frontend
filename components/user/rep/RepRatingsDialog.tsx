"use client";

import { AuthContext } from "@/components/auth/Auth";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
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
import UserPageRepModifyForm from "./modify-rep/UserPageRepModifyForm";
import {
  canManageGivenRatings,
  getRatingRecipient,
  withRatingRecipientIdentity,
} from "./ratingsManagement";
import type { RepDirection } from "./UserPageRep.helpers";
import RatingSortSelect, { type RatingListOrder } from "./RatingSortSelect";
import {
  RATING_CONTRIBUTOR_ROW_CLASS,
  RATING_CONTRIBUTOR_IDENTITY_CLASS,
  RATING_CONTRIBUTOR_NAME_CLASS,
  RATING_CONTRIBUTOR_AMOUNT_CLASS,
} from "./ratingContributorStyles";

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
  category,
  editCategory,
  onSelectCategory,
  onCancel,
  onSuccess,
  onBusyChange,
}: {
  readonly recipient: Recipient;
  readonly owner: string;
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
    enabled: !category,
  });
  const loading = target.isPending || (!category && categories.isPending);
  const error =
    target.isLoadingError || (!category && categories.isLoadingError);
  const retry = () => {
    void target.refetch();
    if (!category) void categories.refetch();
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
      {!loading && !error && (
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
    </div>
  );
}

export default function RepRatingsDialog({
  profile,
  direction,
  category = null,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly direction: RepDirection;
  readonly category?: string | null;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const canManage =
    direction === "given" &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);
  const identity = profile.query ?? profile.handle ?? profile.display;
  const [selectedRating, setSelectedRating] = useState<RatingSelection | null>(
    null
  );
  const selection = canManage ? selectedRating : null;
  const [isOpen, setIsOpen] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RatingListOrder>("rating");
  const orderBy = selectedOrder;
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
    if (selection?.category && !category) {
      setSelectedRating({ ...selection, category: null });
    } else {
      setSelectedRating(null);
    }
  };
  const handleSaveSuccess = () => {
    setIsBusy(false);
    close();
  };
  const getListQueryKey = (sort: RatingListOrder) =>
    [
      QueryKey.PROFILE_RATING_LIST,
      {
        identity,
        matter: "REP",
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
        endpoint: `profiles/${encodeURIComponent(identity)}/rep/ratings/by-rater`,
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
    matter: "REP",
    direction: directionLabel,
  });
  if (selection) {
    const recipientTitleKey = "user.rate.categoriesFor";
    title =
      selection.category !== null
        ? t(locale, "rep.categories.edit.title", {
            name: selection.recipient.identity,
          })
        : t(locale, recipientTitleKey, {
            matter: "REP",
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
      busy={isBusy}
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
          <div className="tw-my-2">
            <RatingSortSelect
              matter="REP"
              direction={direction}
              value={orderBy}
              onChange={changeOrder}
              disabled={isBusy}
            />
          </div>
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
          <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
            {items.map((row) => {
              const target = getRatingRecipient(row);
              const picture =
                "pfp" in row && typeof row.pfp === "string" ? row.pfp : null;
              return (
                <li
                  key={row.profile_id}
                  className={RATING_CONTRIBUTOR_ROW_CLASS}
                >
                  <Link
                    href={`/${encodeURIComponent(target.identity)}`}
                    className={RATING_CONTRIBUTOR_IDENTITY_CLASS}
                  >
                    <span aria-hidden="true">
                      <ProfileAvatar
                        pfpUrl={picture}
                        size={ProfileBadgeSize.SMALL}
                        shape="circle"
                        alt=""
                        fallbackContent={target.display.charAt(0).toUpperCase()}
                      />
                    </span>
                    <span className={RATING_CONTRIBUTOR_NAME_CLASS}>
                      {target.display}
                    </span>
                  </Link>
                  <span
                    className={`${RATING_CONTRIBUTOR_AMOUNT_CLASS} ${row.rating < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
                  >
                    {formatInteger(locale, row.rating)}
                  </span>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={t(locale, "user.rate.adjustFor", {
                        matter: "REP",
                        name: target.display,
                      })}
                      onClick={(event) => {
                        listScroll.current =
                          viewRef.current?.parentElement?.scrollTop ?? 0;
                        listTrigger.current = event.currentTarget;
                        setSelectedRating({ recipient: target, category });
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
              className="tw-mt-4"
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
            category={category}
            editCategory={selection.category}
            onSelectCategory={(selectedCategory) =>
              setSelectedRating({ ...selection, category: selectedCategory })
            }
            onCancel={close}
            onSuccess={handleSaveSuccess}
            onBusyChange={setIsBusy}
          />
        )}
      </div>
    </MobileWrapperDialog>
  );
}
