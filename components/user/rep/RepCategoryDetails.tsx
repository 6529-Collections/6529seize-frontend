"use client";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepContributorsPage } from "@/generated/models/ApiRepContributorsPage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import RatingAmountInput from "./RatingAmountInput";
import RatingEditorFooter from "./RatingEditorFooter";
import RatingEditorErrors from "./RatingEditorErrors";
import { useRepRatingSave } from "./modify-rep/useRepRatingSave";
import {
  canManageGivenRatings,
  isRatingValue,
  isWithinRatingAllowance,
  withRatingRecipientIdentity,
} from "./ratingsManagement";
import { getCanEditRep, type RepDirection } from "./UserPageRep.helpers";

type Contributor = {
  readonly profile: {
    readonly id: string;
    readonly handle: string | null;
    readonly pfp: string | null;
    readonly primary_address: string;
  };
  readonly contribution: number;
};
type CategoryContentLayout = (
  body: ReactNode,
  footer: ReactNode,
  resetOnEscape: () => boolean
) => ReactNode;

function getCategoryRows(
  items: Contributor[],
  pinOwnRow: boolean,
  ownContributor: Contributor | null,
  raterId: string | null | undefined
) {
  if (!pinOwnRow) return items;
  const others = items.filter((row) => row.profile.id !== raterId);
  return ownContributor ? [ownContributor, ...others] : others;
}

function ContributorIdentity({
  row,
  you,
  labelId,
}: {
  readonly row: Contributor;
  readonly you: boolean;
  readonly labelId: string;
}) {
  const locale = useBrowserLocale();
  const identity = row.profile.handle ?? row.profile.primary_address;
  return (
    <Link
      href={`/${encodeURIComponent(identity)}`}
      className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-min-h-0"
    >
      <span
        aria-hidden="true"
        className="tw-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-700 tw-text-xs"
      >
        {row.profile.pfp ? (
          <Image
            unoptimized
            width={24}
            height={24}
            src={getScaledImageUri(row.profile.pfp, ImageScale.W_AUTO_H_50)}
            alt=""
            className="tw-size-full tw-object-cover"
          />
        ) : (
          identity.charAt(0).toUpperCase()
        )}
      </span>
      <span id={labelId} className="tw-truncate">
        {you ? t(locale, "rep.categories.panel.you") : identity}
      </span>
    </Link>
  );
}

function defaultLayout(body: ReactNode, footer: ReactNode) {
  return (
    <>
      {body}
      {footer}
    </>
  );
}

function getAmountValidation({
  value,
  current,
  withinAllowance,
  validNumbers,
  descriptionId,
  formId,
}: {
  readonly value: string;
  readonly current: number;
  readonly withinAllowance: boolean;
  readonly validNumbers: boolean;
  readonly descriptionId: string;
  readonly formId: string;
}) {
  const changed = !isRatingValue(value) || Number(value) !== current;
  const invalidNumber = changed && !isRatingValue(value);
  const overLimit = changed && validNumbers && !withinAllowance;
  return {
    invalid: invalidNumber || overLimit,
    describedBy: [
      descriptionId,
      invalidNumber ? `${formId}-invalid-number` : null,
      overLimit ? `${formId}-credit-limit` : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export default function RepCategoryDetails({
  profile,
  category,
  direction,
  autoFocusOwnAmount = false,
  busy: externalBusy = false,
  onOpenGlobalCategory,
  onBusyChange,
  onSuccess,
  renderContent = defaultLayout,
}: {
  readonly profile: ApiIdentity;
  readonly category: ApiRepCategory;
  readonly direction: RepDirection;
  readonly autoFocusOwnAmount?: boolean;
  readonly busy?: boolean;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly renderContent?: CategoryContentLayout | undefined;
}) {
  const locale = useBrowserLocale();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const ownAmountRef = useRef<HTMLInputElement>(null);
  const didAutoFocus = useRef(false);
  const submitting = useRef(false);
  useKeyboardFocusScroll(formRef);
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const rater = activeProfileProxy?.created_by ?? connectedProfile;
  const proxyIdentity =
    activeProfileProxy?.created_by.handle ??
    activeProfileProxy?.created_by.primary_address;
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
    staleTime: 5 * 60 * 1000,
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
  });
  const items = (query.data?.pages.flatMap((page) => page.data) ?? []).toSorted(
    (a, b) => b.contribution - a.contribution
  );
  // This endpoint's remaining credit is rater-global. For Given we only need
  // that budget, so a stable identity avoids an extra request as rows arrive.
  const {
    repState,
    heroAvailableRep,
    minMaxValues,
    isError,
    isFetching,
    retry,
  } = useRepAllocation({
    profile,
    category: category.category,
    enabled: canEdit,
  });
  const { save, isSaving, error, clearError } = useRepRatingSave();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState(false);
  const busy = externalBusy || preparing || isSaving;
  const ready = !!repState && !isError;
  const ownContribution =
    repState?.rater_contribution ??
    items.find((row) => row.profile.id === rater?.id)?.contribution ??
    0;
  const ownContributor: Contributor | null =
    canEdit && rater?.id && ownContribution !== 0
      ? {
          profile: {
            id: rater.id,
            handle: rater.handle,
            pfp: rater.pfp,
            primary_address:
              activeProfileProxy?.created_by.primary_address ??
              connectedProfile?.primary_wallet ??
              connectedProfile?.wallets?.[0]?.wallet ??
              "",
          },
          contribution: ownContribution,
        }
      : null;
  const rows = getCategoryRows(
    items,
    direction === "received" && canEdit,
    ownContributor,
    rater?.id
  );
  const hasOwnContribution = ownContributor !== null;
  useEffect(() => {
    if (
      !autoFocusOwnAmount ||
      direction !== "received" ||
      !ready ||
      !hasOwnContribution ||
      didAutoFocus.current
    )
      return;
    const input = ownAmountRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    didAutoFocus.current = true;
  }, [autoFocusOwnAmount, direction, ready, hasOwnContribution]);
  const editableRows = canEdit
    ? rows.filter((row) => direction === "given" || row === ownContributor)
    : [];
  const creditDelta = (row: Contributor) =>
    Math.abs(Number(drafts[row.profile.id])) - Math.abs(row.contribution);
  const changes = editableRows
    .filter(
      (row) =>
        drafts[row.profile.id] !== undefined &&
        (!isRatingValue(drafts[row.profile.id] ?? "") ||
          Number(drafts[row.profile.id]) !== row.contribution)
    )
    .toSorted((a, b) => creditDelta(a) - creditDelta(b));
  const validNumbers = changes.every((row) =>
    isRatingValue(drafts[row.profile.id] ?? "")
  );
  const withinAllowance =
    direction === "given"
      ? isWithinRatingAllowance(changes.map(creditDelta), heroAvailableRep)
      : changes.every(
          (row) =>
            !!activeProfileProxy ||
            (Number(drafts[row.profile.id]) >= minMaxValues.min &&
              Number(drafts[row.profile.id]) <= minMaxValues.max)
        );
  const canSave =
    ready && validNumbers && withinAllowance && changes.length > 0 && !busy;
  const before = category.total_rep;
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
  const resetOnEscape = () => {
    if (busy) return true;
    if (changes.length === 0) return false;
    reset();
    return true;
  };
  const updateDraft = (id: string, raw: string) => {
    let value = raw === "0-" || raw === "-0" ? "-" : raw;
    if (value.length > 1 && value.startsWith("0")) value = value.slice(1);
    if (/^-?\d*$/.test(value))
      setDrafts((previous) => ({ ...previous, [id]: value }));
  };
  const submit = async () => {
    if (!canSave || submitting.current) return;
    submitting.current = true;
    setPreparing(true);
    setPrepareError(false);
    onBusyChange(true);
    const savedIds = new Set<string>();
    let succeeded = false;
    try {
      const updates = await Promise.all(
        changes.map(async (row) => ({
          profile:
            direction === "received"
              ? profile
              : withRatingRecipientIdentity(
                  await queryClient.fetchQuery({
                    ...getIdentityQueryOptions({
                      handleOrWallet:
                        row.profile.handle ?? row.profile.primary_address,
                    }),
                    staleTime: 5 * 60 * 1000,
                  }),
                  row.profile.handle ?? row.profile.primary_address
                ),
          amount: Number(drafts[row.profile.id]),
          category: category.category,
          row,
        }))
      );
      succeeded = await save(updates, (update) =>
        savedIds.add(update.row.profile.id)
      );
    } catch {
      setPrepareError(true);
    } finally {
      if (savedIds.size > 0)
        setDrafts((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(([id]) => !savedIds.has(id))
          )
        );
      setPreparing(false);
      submitting.current = false;
      onBusyChange(false);
    }
    if (succeeded) onSuccess?.();
  };
  const openCategory = (
    <Button
      variant="ghost"
      size={null}
      className="tw-min-h-11 tw-gap-1 tw-px-0 tw-text-xs tw-font-medium lg:tw-min-h-[34px]"
      disabled={busy}
      aria-label={t(locale, "rep.categories.pill.openGlobalAriaLabel", {
        category: category.category,
      })}
      onClick={() => onOpenGlobalCategory(category.category)}
    >
      {t(locale, "rep.categories.panel.openGlobal")}
      <ArrowUpRightIcon className="tw-size-3.5" aria-hidden="true" />
    </Button>
  );
  const footer = canEdit ? (
    <RatingEditorFooter
      matter="REP"
      formId={formId}
      editable
      changed={changes.length > 0}
      before={before}
      after={validNumbers ? after : null}
      available={ready ? heroAvailableRep : null}
      busy={busy}
      canSave={canSave}
      onCancel={reset}
      idleAction={openCategory}
    >
      <RatingEditorErrors
        formId={formId}
        matter="REP"
        validNumbers={validNumbers}
        withinAllowance={withinAllowance}
        changed={changes.length > 0}
        available={heroAvailableRep}
        error={error}
        prepareError={prepareError}
      />
    </RatingEditorFooter>
  ) : (
    <div className="tw-min-h-[50px] tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-px-2.5 tw-py-2">
      {openCategory}
    </div>
  );
  const body = (
    <form
      id={formId}
      ref={formRef}
      className="tw-min-w-0"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && changes.length > 0 && resetOnEscape()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {activeProfileProxy && (
        <p className="tw-m-0 tw-px-2.5 tw-py-2 tw-text-xs tw-text-iron-400">
          {tRich(locale, "rep.categories.edit.proxy", {
            name: (
              <Link
                key="proxy-profile"
                href={`/${encodeURIComponent(proxyIdentity ?? "")}`}
                className="tw-text-primary-300"
              >
                {proxyIdentity}
              </Link>
            ),
          })}
        </p>
      )}
      {query.isPending && (
        <output className="tw-block tw-px-2.5 tw-py-5 tw-text-sm tw-text-iron-400">
          {t(locale, "user.rate.loading")}
        </output>
      )}
      {query.isLoadingError && (
        <p role="alert" className="tw-px-2.5 tw-text-sm tw-text-iron-300">
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
        </p>
      )}
      <div className="tw-max-h-[min(50dvh,24rem)] tw-overflow-y-auto tw-overscroll-contain">
        {rows.map((row) => {
          const you = direction === "received" && row === ownContributor;
          const editable = canEdit && (direction === "given" || you);
          const value = drafts[row.profile.id] ?? String(row.contribution);
          const descriptionId = `${formId}-${row.profile.id}-description`;
          const validation = getAmountValidation({
            value,
            current: row.contribution,
            withinAllowance,
            validNumbers,
            descriptionId,
            formId,
          });
          return (
            <div
              key={row.profile.id}
              data-rating-row
              className={`tw-flex tw-min-h-[50px] tw-min-w-0 tw-items-center tw-gap-2 tw-pb-[5px] tw-pl-2.5 tw-pr-1.5 tw-pt-[5px] ${you ? "tw-sticky tw-top-0 tw-z-10 tw-bg-[#17171B]" : ""}`}
            >
              <ContributorIdentity
                row={row}
                you={you}
                labelId={`${formId}-${row.profile.id}-name`}
              />
              {editable ? (
                <>
                  <span id={descriptionId} className="tw-sr-only">
                    {t(locale, "rep.categories.panel.amountFor", {
                      name: you
                        ? t(locale, "rep.categories.panel.you")
                        : (row.profile.handle ?? row.profile.primary_address),
                    })}
                  </span>
                  <RatingAmountInput
                    ref={you ? ownAmountRef : undefined}
                    originalAmount={row.contribution}
                    value={ready ? value : ""}
                    aria-labelledby={`${formId}-${row.profile.id}-name`}
                    aria-describedby={validation.describedBy}
                    aria-invalid={validation.invalid}
                    readOnly={!ready || busy}
                    placeholder={t(
                      locale,
                      "rep.categories.panel.loadingAmount"
                    )}
                    onChange={(event) =>
                      updateDraft(row.profile.id, event.currentTarget.value)
                    }
                  />
                </>
              ) : (
                <span
                  className={`tw-shrink-0 tw-text-right tw-text-sm tw-font-medium ${row.contribution < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
                >
                  {formatInteger(locale, row.contribution)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {query.isSuccess && rows.length === 0 && (
        <p className="tw-px-2.5 tw-text-sm tw-text-iron-400">
          {t(locale, "user.rate.empty")}
        </p>
      )}
      {canEdit && isError && (
        <p role="alert" className="tw-px-2.5 tw-text-sm tw-text-iron-300">
          {t(locale, "rep.categories.edit.loadError")}{" "}
          <Button
            size="sm"
            variant="ghost"
            onClick={retry}
            loading={isFetching}
          >
            {t(locale, "rep.categories.edit.retry")}
          </Button>
        </p>
      )}
      {query.isFetchNextPageError && (
        <p role="alert" className="tw-px-2.5 tw-text-sm tw-text-iron-400">
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
    </form>
  );
  return renderContent(body, footer, resetOnEscape);
}
