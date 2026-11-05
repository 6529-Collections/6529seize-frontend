"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { formatAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useContext, useState } from "react";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageRepModifyModal from "./modify-rep/UserPageRepModifyModal";
import { canManageGivenRatings } from "./ratingsManagement";
import type { RepDirection } from "./UserPageRep.helpers";

type RatingPage = {
  readonly data: ApiRatingWithProfileInfoAndLevel[];
  readonly page: number;
  readonly next: boolean;
};
type Recipient = { readonly identity: string; readonly display: string };

function getRecipient(row: ApiRatingWithProfileInfoAndLevel): Recipient {
  const identity = row.handle.trim() || (row.wallets[0] ?? row.profile_id);
  return { identity, display: row.handle.trim() || formatAddress(identity) };
}

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
      <div role="status" className="tw-flex tw-justify-center tw-gap-3 tw-py-6">
        <CircleLoader />
        <span className="tw-sr-only">{t(locale, "user.rate.loading")}</span>
      </div>
    );
  return null;
}

function RecipientRatings({
  recipient,
  owner,
  matter,
  category,
  onBack,
}: {
  readonly recipient: Recipient;
  readonly owner: string;
  readonly matter: "REP" | "NIC";
  readonly category: string | null;
  readonly onBack: () => void;
}) {
  const locale = useBrowserLocale();
  const [editCategory, setEditCategory] = useState(category);
  const target = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: recipient.identity }),
  });
  const categories = useQuery({
    queryKey: [
      QueryKey.PROFILE_RATING_LIST,
      "recipientCategories",
      owner,
      recipient.identity,
    ],
    queryFn: () =>
      commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${encodeURIComponent(recipient.identity)}/rep/ratings/received`,
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

  return (
    <>
      <MobileWrapperDialog
        title={t(
          locale,
          matter === "REP" ? "user.rate.categoriesFor" : "user.rate.adjustFor",
          { matter, name: recipient.display }
        )}
        isOpen
        onClose={onBack}
        onBack={onBack}
        tabletModal
        maxWidthClass="md:tw-max-w-md"
        headerVariant="minimal"
      >
        <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
          <RatingLoadState loading={loading} error={error} retry={retry} />
          {!loading && !error && matter === "REP" && !category && (
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
                    onClick={() => setEditCategory(row.category)}
                    aria-label={t(locale, "user.rate.adjustFor", {
                      matter: `REP (${row.category})`,
                      name: recipient.display,
                    })}
                  >
                    {t(locale, "user.rate.adjust")}
                  </Button>
                </div>
              ))}
            </>
          )}
          {!loading && !error && matter === "NIC" && (
            <UserPageIdentityHeaderCICRate
              profile={target.data}
              isTooltip={false}
              locale={locale}
              onSuccess={onBack}
              onCancel={onBack}
            />
          )}
        </div>
      </MobileWrapperDialog>
      {target.data && editCategory && !error && (
        <UserPageRepModifyModal
          profile={target.data}
          category={editCategory}
          onClose={onBack}
        />
      )}
    </>
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
  const canManage =
    direction === "given" &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);
  const identity = profile.query ?? profile.handle ?? profile.display;
  const [recipient, setRecipient] = useState<Recipient | null>(null);
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
    queryFn: ({ pageParam }) =>
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
      }),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const directionLabel = t(
    locale,
    direction === "given" ? "user.rate.given" : "user.rate.received"
  );
  return (
    <>
      <MobileWrapperDialog
        title={t(locale, "user.rate.listTitle", {
          matter,
          direction: directionLabel,
        })}
        isOpen
        onClose={onClose}
        tall
        fixedHeight
        tabletModal
        noPadding
        maxWidthClass="md:tw-max-w-xl"
        showScrollbar
      >
        <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
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
            <p role="status" className="tw-py-4 tw-text-sm tw-text-iron-400">
              {t(locale, "user.rate.empty")}
            </p>
          )}
          <ul className="tw-m-0 tw-list-none tw-p-0">
            {items.map((row) => {
              const target = getRecipient(row);
              return (
                <li
                  key={row.profile_id}
                  className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-rounded-lg tw-py-2"
                >
                  <Link
                    href={`/${encodeURIComponent(target.identity)}`}
                    className="tw-min-w-0 tw-flex-1 tw-break-words tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline hover:tw-text-white"
                  >
                    {target.display}
                  </Link>
                  <span className="tw-shrink-0 tw-text-sm tw-tabular-nums tw-text-iron-300">
                    {formatInteger(locale, row.rating)}
                  </span>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="tw-min-h-11 tw-shrink-0"
                      aria-label={t(locale, "user.rate.adjustFor", {
                        matter,
                        name: target.display,
                      })}
                      onClick={() => setRecipient(target)}
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
      </MobileWrapperDialog>
      {canManage && recipient && (
        <RecipientRatings
          key={recipient.identity}
          recipient={recipient}
          owner={identity}
          matter={matter}
          category={category}
          onBack={() => setRecipient(null)}
        />
      )}
    </>
  );
}
