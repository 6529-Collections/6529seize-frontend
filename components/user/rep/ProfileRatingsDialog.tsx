"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { AuthContext } from "@/components/auth/Auth";
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
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
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
  onBack,
  onSuccess,
  onBusyChange,
}: {
  readonly recipient: Recipient;
  readonly owner: string;
  readonly matter: "REP" | "NIC";
  readonly category: string | null;
  readonly editCategory: string | null;
  readonly onSelectCategory: (category: string) => void;
  readonly onBack: () => void;
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
      <UserPageRepModifyForm
        profile={recipientProfile}
        category={editCategory}
        onCancel={onBack}
        onSuccess={onSuccess}
        onBusyChange={onBusyChange}
      />
    );
  }

  return (
    <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
      <RatingLoadState loading={loading} error={error} retry={retry} />
      {!loading && !error && matter === "REP" && (
        <>
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "user.rate.chooseCategory")}
          </p>
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
              <span className="tw-text-sm tw-tabular-nums tw-text-iron-300">
                {formatInteger(locale, row.rater_contribution)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="tw-min-h-11 tw-shrink-0"
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
        <UserPageIdentityHeaderCICRate
          profile={recipientProfile}
          isTooltip={false}
          locale={locale}
          onSuccess={onSuccess}
          onCancel={onBack}
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
  }, [selection]);

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
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.PROFILE_RATING_LIST,
      {
        identity,
        matter,
        direction,
        category,
        owner: connectedProfile?.id,
        proxy: activeProfileProxy?.id,
      },
    ],
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<RatingPage>({
        endpoint: `profiles/${encodeURIComponent(identity)}/${matter === "REP" ? "rep" : "cic"}/ratings/by-rater`,
        params: {
          given: String(direction === "given"),
          ...(category ? { category } : {}),
          order_by: direction === "given" ? "last_modified" : "rating",
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
      onClose={() => setIsOpen(false)}
      onAfterLeave={onClose}
      onBack={selection ? back : undefined}
      dismissible={!isBusy}
      tabletModal
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
          {direction === "given" && (
            <p className="tw-mt-2 tw-text-xs tw-text-iron-400">
              {t(locale, "user.rate.recentFirst")}
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
          <ul className="tw-m-0 tw-list-none tw-p-0">
            {items.map((row) => {
              const target = getRatingRecipient(row);
              return (
                <li
                  key={row.profile_id}
                  className="tw-flex tw-min-h-[72px] tw-min-w-0 tw-items-center tw-gap-3 tw-py-3 lg:tw-min-h-0 lg:tw-py-2"
                >
                  <div className="tw-min-w-0 tw-flex-1 lg:tw-contents">
                    <Link
                      href={`/${encodeURIComponent(target.identity)}`}
                      className="tw-block tw-min-w-0 tw-break-words tw-py-1 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline hover:tw-text-white lg:tw-flex-1 lg:tw-py-2"
                    >
                      {target.display}
                    </Link>
                    <span className="tw-block tw-text-xs tw-tabular-nums tw-text-iron-400 lg:tw-shrink-0 lg:tw-text-sm lg:tw-text-iron-300">
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
                      className="tw-min-h-11 tw-shrink-0"
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
            onBack={back}
            onSuccess={returnAfterSave}
            onBusyChange={setIsBusy}
          />
        )}
      </div>
    </MobileWrapperDialog>
  );
}
