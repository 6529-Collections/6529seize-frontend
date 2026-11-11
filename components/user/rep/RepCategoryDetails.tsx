"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepContributorsPage } from "@/generated/models/ApiRepContributorsPage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";
import { useRepRatingSave } from "./modify-rep/useRepRatingSave";
import {
  canManageGivenRatings,
  isRatingValue,
  withRatingRecipientIdentity,
} from "./ratingsManagement";
import {
  getCanEditRep,
  getContributorLabel,
  type RepDirection,
} from "./UserPageRep.helpers";

type CategoryContributor = {
  readonly profile: {
    readonly id: string;
    readonly handle: string | null;
    readonly primary_address: string;
    readonly pfp: string | null;
  };
  readonly contribution: number;
};

function ContributorIdentity({
  contributor,
  you = false,
}: {
  readonly contributor: CategoryContributor;
  readonly you?: boolean;
}) {
  const locale = useBrowserLocale();
  const identity =
    contributor.profile.handle ?? contributor.profile.primary_address;
  return (
    <Link
      href={`/${encodeURIComponent(identity)}`}
      className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <span
        className="tw-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-700 tw-text-xs"
        aria-hidden="true"
      >
        {contributor.profile.pfp ? (
          <Image
            unoptimized
            width={24}
            height={24}
            src={getScaledImageUri(
              contributor.profile.pfp,
              ImageScale.W_AUTO_H_50
            )}
            alt=""
            className="tw-size-full tw-object-cover"
          />
        ) : (
          identity.charAt(0).toUpperCase()
        )}
      </span>
      <span className="tw-truncate">
        {you ? t(locale, "rep.categories.panel.you") : identity}
      </span>
    </Link>
  );
}

function CategoryRows({
  items,
}: {
  readonly items: readonly CategoryContributor[];
}) {
  const locale = useBrowserLocale();
  return items.map((item) => (
    <div
      key={item.profile.id}
      className="tw-flex tw-h-[52px] tw-items-center tw-gap-3 tw-px-3 lg:tw-h-10"
    >
      <ContributorIdentity contributor={item} />
      <span
        className={`tw-shrink-0 tw-text-sm tw-tabular-nums ${item.contribution < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
      >
        {formatInteger(locale, item.contribution)}
      </span>
    </div>
  ));
}

function EditableCategoryRows({
  profile,
  category,
  direction,
  items,
  focusInput,
  onBusyChange,
  onRefresh,
}: {
  readonly profile: ApiIdentity;
  readonly category: ApiRepCategory;
  readonly direction: RepDirection;
  readonly items: readonly CategoryContributor[];
  readonly focusInput: number;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onRefresh: () => Promise<unknown>;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const rater = activeProfileProxy?.created_by ?? connectedProfile;
  const firstRecipient = items[0]?.profile;
  const allowanceTarget =
    direction === "given" && firstRecipient
      ? withRatingRecipientIdentity(
          profile,
          firstRecipient.handle ?? firstRecipient.primary_address
        )
      : profile;
  const {
    repState,
    minMaxValues,
    heroAvailableRep,
    isError,
    isFetching,
    retry,
  } = useRepAllocation({
    profile: allowanceTarget,
    category: category.category,
  });
  const { save, isSaving, error, clearError } = useRepRatingSave();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState(false);
  const submitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = isSaving || preparing;
  const ready = !!repState && !isError;
  useEffect(() => {
    if (focusInput) inputRef.current?.focus({ preventScroll: true });
  }, [focusInput]);

  const current = repState?.rater_contribution ?? 0;
  const ownContributor: CategoryContributor | null = rater?.id
    ? {
        profile: {
          id: rater.id,
          handle: rater.handle,
          primary_address: connectedProfile?.wallets?.[0]?.wallet ?? "",
          pfp: rater.pfp,
        },
        contribution: current,
      }
    : null;
  const rows =
    direction === "received" && ownContributor
      ? [
          ownContributor,
          ...items.filter((item) => item.profile.id !== rater?.id),
        ]
      : items;
  const editableRows =
    direction === "received"
      ? rows.filter((row) => row === ownContributor)
      : rows;
  const changes = editableRows.filter(
    (row) =>
      drafts[row.profile.id] !== undefined &&
      (!isRatingValue(drafts[row.profile.id] ?? "") ||
        Number(drafts[row.profile.id]) !== row.contribution)
  );
  const validNumbers = changes.every((row) =>
    isRatingValue(drafts[row.profile.id] ?? "")
  );
  const creditDelta = changes.reduce(
    (sum, row) =>
      sum +
      Math.abs(Number(drafts[row.profile.id])) -
      Math.abs(row.contribution),
    0
  );
  const withinAllowance =
    direction === "given"
      ? creditDelta <= heroAvailableRep
      : changes.every((row) => {
          const amount = Number(drafts[row.profile.id]);
          return (
            !!activeProfileProxy ||
            (amount >= minMaxValues.min && amount <= minMaxValues.max)
          );
        });
  const canSave =
    ready && validNumbers && withinAllowance && changes.length > 0 && !busy;
  const before = direction === "received" ? current : category.total_rep;
  const after =
    before +
    changes.reduce(
      (sum, row) => sum + Number(drafts[row.profile.id]) - row.contribution,
      0
    );
  const reset = () => {
    setDrafts({});
    setPrepareError(false);
    clearError();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || submitting.current) return;
    submitting.current = true;
    onBusyChange(true);
    setPreparing(true);
    setPrepareError(false);
    const savedIds = new Set<string>();
    try {
      // Fetch real recipient identities for the same cache invalidation used by Manage given.
      const updates = await Promise.all(
        changes.map(async (row) => ({
          profile:
            direction === "received"
              ? profile
              : withRatingRecipientIdentity(
                  await queryClient.fetchQuery(
                    getIdentityQueryOptions({
                      handleOrWallet:
                        row.profile.handle ?? row.profile.primary_address,
                    })
                  ),
                  row.profile.handle ?? row.profile.primary_address
                ),
          amount: Number(drafts[row.profile.id]),
          category: category.category,
          row,
        }))
      );
      // Return released credit before spending it on another receiver.
      updates.sort(
        (a, b) =>
          Math.abs(a.amount) -
          Math.abs(a.row.contribution) -
          (Math.abs(b.amount) - Math.abs(b.row.contribution))
      );
      await save(updates, (update) => {
        const saved = updates.find((item) => item.profile === update.profile);
        if (saved) savedIds.add(saved.row.profile.id);
      });
    } catch {
      setPrepareError(true);
    } finally {
      if (savedIds.size > 0) {
        await onRefresh();
        setDrafts((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(([id]) => !savedIds.has(id))
          )
        );
      }
      setPreparing(false);
      onBusyChange(false);
      submitting.current = false;
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && changes.length > 0 && !busy) {
          event.preventDefault();
          event.stopPropagation();
          reset();
        }
      }}
      aria-busy={busy}
    >
      {activeProfileProxy && (
        <p className="tw-m-0 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400">
          {t(locale, "rep.categories.edit.proxy")}{" "}
          <Link
            href={`/${encodeURIComponent(activeProfileProxy.created_by.handle ?? "")}`}
            className="tw-text-primary-300"
          >
            {activeProfileProxy.created_by.handle}
          </Link>
        </p>
      )}
      <div className="tw-max-h-[min(50dvh,24rem)] tw-overflow-y-auto tw-overscroll-contain">
        {rows.map((row, index) => {
          const editable = direction === "given" || row === ownContributor;
          const value = drafts[row.profile.id] ?? String(row.contribution);
          const changed =
            !isRatingValue(value) || Number(value) !== row.contribution;
          const negative = value.startsWith("-");
          let color = "tw-text-iron-200";
          if (changed) color = "tw-text-primary-300";
          if (negative) color = "tw-text-rose-400";
          return (
            <div
              key={row.profile.id}
              className={`tw-flex tw-h-[52px] tw-items-center tw-gap-3 tw-px-3 lg:tw-h-10 ${direction === "received" && index === 0 ? "tw-sticky tw-top-0 tw-z-10 tw-rounded-lg tw-bg-[#172436]" : ""}`}
            >
              <ContributorIdentity
                contributor={row}
                you={direction === "received" && index === 0}
              />
              {editable ? (
                <input
                  ref={index === 0 ? inputRef : undefined}
                  type="text"
                  data-autofocus={(index === 0 && focusInput > 0) || undefined}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={t(locale, "rep.categories.panel.amountFor", {
                    name: row.profile.handle ?? row.profile.primary_address,
                  })}
                  aria-invalid={
                    changed && (!isRatingValue(value) || !withinAllowance)
                  }
                  readOnly={!ready || busy}
                  value={ready ? value : ""}
                  placeholder={t(locale, "rep.categories.panel.loadingAmount")}
                  onChange={(event) => {
                    const rawValue = event.currentTarget.value;
                    let inputValue =
                      rawValue === "0-" || rawValue === "-0" ? "-" : rawValue;
                    if (inputValue.length > 1 && inputValue.startsWith("0"))
                      inputValue = inputValue.slice(1);
                    if (/^-?\d*$/.test(inputValue))
                      setDrafts((previous) => ({
                        ...previous,
                        [row.profile.id]: inputValue,
                      }));
                  }}
                  className={`tw-h-9 tw-w-28 tw-min-w-0 tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-2 tw-text-right tw-text-base tw-tabular-nums focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-h-8 lg:tw-text-sm ${color}`}
                />
              ) : (
                <span
                  className={`tw-text-sm tw-tabular-nums ${row.contribution < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
                >
                  {formatInteger(locale, row.contribution)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {isError && (
        <div
          role="alert"
          className="tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300"
        >
          {t(locale, "rep.categories.edit.loadError")}{" "}
          <Button
            size="sm"
            variant="ghost"
            onClick={retry}
            loading={isFetching}
          >
            {t(locale, "rep.categories.edit.retry")}
          </Button>
        </div>
      )}
      {(error !== null || prepareError) && (
        <p
          role="alert"
          className="tw-m-0 tw-px-3 tw-py-2 tw-text-sm tw-text-rose-400"
        >
          {error ?? t(locale, "rep.categories.edit.updateError")}{" "}
          {t(locale, "rep.categories.panel.saveRecovery")}
        </p>
      )}
      {changes.length > 0 && (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-800/60 tw-p-3">
          <output className="tw-text-sm tw-tabular-nums tw-text-iron-300">
            {t(
              locale,
              direction === "received"
                ? "rep.categories.panel.yourRep"
                : "rep.categories.panel.total"
            )}{" "}
            {direction === "given" ? (
              <s>{formatInteger(locale, before)}</s>
            ) : (
              formatInteger(locale, before)
            )}
            {" → "}
            {validNumbers ? formatInteger(locale, after) : "—"}
          </output>
          <div className="tw-flex tw-gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
              {t(locale, "rep.categories.edit.cancel")}
            </Button>
            <Button
              variant="action"
              size="sm"
              type="submit"
              loading={busy}
              disabled={!canSave}
            >
              {t(locale, "rep.categories.edit.save")}
            </Button>
          </div>
          {validNumbers && !withinAllowance && (
            <p
              role="alert"
              className="tw-m-0 tw-w-full tw-text-xs tw-text-rose-400"
            >
              {t(locale, "rep.categories.panel.creditLimit", {
                amount: formatInteger(locale, heroAvailableRep),
              })}
            </p>
          )}
        </div>
      )}
    </form>
  );
}

export default function RepCategoryDetails({
  profile,
  category,
  direction,
  focusInput,
  onOpenGlobalCategory,
  onBusyChange,
}: {
  readonly profile: ApiIdentity;
  readonly category: ApiRepCategory;
  readonly direction: RepDirection;
  readonly focusInput: number;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onBusyChange: (busy: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const canEdit =
    direction === "given"
      ? canManageGivenRatings(profile, connectedProfile, activeProfileProxy)
      : getCanEditRep({
          myProfile: connectedProfile,
          targetProfile: profile,
          activeProfileProxy,
        });
  const identity = profile.query ?? profile.handle ?? profile.display;
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.PROFILE_REP_CATEGORY_CONTRIBUTORS,
      { identity, scope: "category", direction, category: category.category },
    ],
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<ApiRepContributorsPage>({
        endpoint: `profiles/${encodeURIComponent(identity)}/rep/categories/${encodeURIComponent(category.category)}/contributors`,
        params: {
          ...(direction === "given" ? { direction: "outgoing" } : {}),
          page: String(pageParam),
          page_size: "100",
        },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
  });
  const items = (query.data?.pages.flatMap((page) => page.data) ?? []).toSorted(
    (a, b) => b.contribution - a.contribution
  );
  return (
    <div className="tw-min-w-0 tw-py-2">
      <div className="tw-mb-2 tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-3 tw-px-3">
        <span className="tw-text-xs tw-text-iron-400">
          {formatInteger(locale, category.contributor_count)}{" "}
          {getContributorLabel(direction, category.contributor_count)}
        </span>
        <button
          type="button"
          onClick={() => onOpenGlobalCategory(category.category)}
          className="tw-min-h-9 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-text-iron-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "rep.categories.panel.openGlobal")}
        </button>
      </div>
      {query.isPending && (
        <output className="tw-block tw-px-3 tw-py-6 tw-text-sm tw-text-iron-400">
          {t(locale, "user.rate.loading")}
        </output>
      )}
      {query.isLoadingError && (
        <div role="alert" className="tw-p-3 tw-text-sm tw-text-iron-300">
          {t(locale, "user.rate.loadError")}{" "}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void query.refetch();
            }}
          >
            {t(locale, "user.rate.retry")}
          </Button>
        </div>
      )}
      {canEdit && (direction === "received" || items.length > 0) ? (
        <EditableCategoryRows
          profile={profile}
          category={category}
          direction={direction}
          items={items}
          focusInput={focusInput}
          onBusyChange={onBusyChange}
          onRefresh={() => query.refetch()}
        />
      ) : (
        <div className="tw-max-h-[min(50dvh,24rem)] tw-overflow-y-auto tw-overscroll-contain">
          <CategoryRows items={items} />
        </div>
      )}
      {query.isSuccess && items.length === 0 && !canEdit && (
        <p className="tw-px-3 tw-text-sm tw-text-iron-400">
          {t(locale, "user.rate.empty")}
        </p>
      )}
      {query.isFetchNextPageError && (
        <p role="alert" className="tw-px-3 tw-text-sm tw-text-iron-400">
          {t(locale, "user.rate.loadError")}
        </p>
      )}
      {query.hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          loading={query.isFetchingNextPage}
          onClick={() => {
            void query.fetchNextPage();
          }}
        >
          {t(
            locale,
            query.isFetchNextPageError
              ? "user.rate.retry"
              : "user.rate.loadMore"
          )}
        </Button>
      )}
    </div>
  );
}
