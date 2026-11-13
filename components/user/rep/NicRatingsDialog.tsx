"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  useInfiniteQuery,
  useQueries,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import Link from "next/link";
import { useContext, useId, useRef, useState } from "react";
import { useNicRatingState } from "../identity/header/cic-rate/useNicRatingState";
import RatingAmountInput from "./RatingAmountInput";
import RatingEditorFooter from "./RatingEditorFooter";
import RatingEditorErrors from "./RatingEditorErrors";
import { useRatingSave } from "./modify-rep/useRatingSave";
import {
  canManageGivenRatings,
  getRatingRecipient,
  isRatingValue,
  isWithinRatingAllowance,
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

type Matter = "NIC";
type RatingPage = {
  readonly data: ApiRatingWithProfileInfoAndLevel[];
  readonly page: number;
  readonly next: boolean;
};

type Props = {
  readonly profile: ApiIdentity;
  readonly matter: Matter;
  readonly direction: RepDirection;
  readonly total?: number | undefined;
  readonly contributorCount?: number | undefined;
  readonly onClose: () => void;
};
type Draft = {
  readonly identity: string;
  readonly original: number;
  readonly value: string;
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
      <div role="alert" className="tw-py-3 tw-text-sm tw-text-iron-300">
        {t(locale, "user.rate.loadError")}{" "}
        <Button variant="ghost" size="sm" onClick={retry}>
          {t(locale, "user.rate.retry")}
        </Button>
      </div>
    );
  if (loading)
    return (
      <output className="tw-flex tw-justify-center tw-gap-3 tw-py-5">
        <CircleLoader />
        <span className="tw-sr-only">{t(locale, "user.rate.loading")}</span>
      </output>
    );
  return null;
}

export default function NicRatingsDialog(props: Props) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();
  return (
    <RatingsList
      key={`${props.profile.id ?? props.profile.display}:${connectedProfile?.id ?? "visitor"}:${activeProfileProxy?.id ?? "self"}`}
      {...props}
      connectedProfile={connectedProfile}
      activeProfileProxy={activeProfileProxy}
      address={address ?? null}
    />
  );
}

function RatingsList({
  profile,
  matter,
  direction,
  total,
  contributorCount,
  onClose,
  connectedProfile,
  activeProfileProxy,
  address,
}: Props & {
  readonly connectedProfile: ApiIdentity | null;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly address: string | null;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useKeyboardFocusScroll(formRef);
  const submitting = useRef(false);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RatingListOrder>("rating");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState(false);
  const identity = profile.query ?? profile.handle ?? profile.display;
  const canManage =
    direction === "given" &&
    !!address &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);
  const orderBy = selectedOrder;
  const getListQueryKey = (sort: RatingListOrder) =>
    [
      QueryKey.PROFILE_RATING_LIST,
      {
        identity,
        matter,
        direction,
        owner: connectedProfile?.id,
        proxy: activeProfileProxy?.id,
        orderBy: sort,
      },
    ] as const;
  const query = useInfiniteQuery({
    queryKey: getListQueryKey(orderBy),
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<RatingPage>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/ratings/by-rater`,
        params: {
          given: String(direction === "given"),
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
  const targets = items.map(getRatingRecipient);
  // Profile pictures share the identity cache with profile previews.
  const identities = useQueries({
    queries: targets.map((target) => ({
      ...getIdentityQueryOptions({ handleOrWallet: target.identity }),
      staleTime: 5 * 60 * 1000,
    })),
  });
  // The allowance belongs to the rater, so changing list order needs no new read.
  const nicState = useNicRatingState(identity, canManage);
  const { save, isSaving, error, clearError } = useRatingSave(
    matter,
    address?.toLowerCase() ?? null
  );
  const busy = preparing || isSaving;
  const available = nicState.data?.cic_ratings_left_to_give_by_rater;
  const allowanceReady = available !== undefined && !nicState.isError;
  const changes = Object.entries(drafts).toSorted(
    ([, a], [, b]) =>
      Math.abs(Number(a.value)) -
      Math.abs(a.original) -
      (Math.abs(Number(b.value)) - Math.abs(b.original))
  );
  const validNumbers = changes.every(([, draft]) => isRatingValue(draft.value));
  const withinAllowance = isWithinRatingAllowance(
    changes.map(
      ([, draft]) => Math.abs(Number(draft.value)) - Math.abs(draft.original)
    ),
    available ?? 0
  );
  const canSave =
    canManage &&
    allowanceReady &&
    validNumbers &&
    withinAllowance &&
    changes.length > 0 &&
    !busy;
  const before = total ?? items.reduce((sum, row) => sum + row.rating, 0);
  const after =
    before +
    changes.reduce(
      (sum, [, draft]) => sum + Number(draft.value) - draft.original,
      0
    );
  const reset = () => {
    setDrafts({});
    setPrepareError(false);
    clearError();
  };
  const close = () => {
    if (!busy) setIsOpen(false);
  };
  const escape = () => {
    if (!busy && changes.length > 0) reset();
    else close();
  };
  const changeOrder = (next: RatingListOrder) => {
    if (next === orderBy) return;
    const key = getListQueryKey(next);
    const cached =
      queryClient.getQueryState<InfiniteData<RatingPage, number>>(key);
    if (cached?.data && cached.data.pages.length > 1)
      queryClient.setQueryData(
        key,
        {
          ...cached.data,
          pages: cached.data.pages.slice(0, 1),
          pageParams: cached.data.pageParams.slice(0, 1),
        },
        { updatedAt: cached.dataUpdatedAt }
      );
    setSelectedOrder(next);
    formRef.current?.parentElement?.scrollTo({ top: 0 });
  };
  const updateDraft = (
    key: string,
    draft: Omit<Draft, "value">,
    raw: string
  ) => {
    let value = raw === "0-" || raw === "-0" ? "-" : raw;
    if (value.length > 1 && value.startsWith("0")) value = value.slice(1);
    if (!/^-?\d*$/.test(value)) return;
    setDrafts((previous) => {
      const next = { ...previous };
      if (isRatingValue(value) && Number(value) === draft.original)
        delete next[key];
      else next[key] = { ...draft, value };
      return next;
    });
  };
  const submit = async () => {
    if (!canSave || submitting.current) return;
    submitting.current = true;
    setPreparing(true);
    setPrepareError(false);
    const saved = new Set<string>();
    try {
      const updates = await Promise.all(
        changes.map(async ([key, draft]) => ({
          key,
          profile: withRatingRecipientIdentity(
            await queryClient.fetchQuery({
              ...getIdentityQueryOptions({ handleOrWallet: draft.identity }),
              staleTime: 5 * 60 * 1000,
            }),
            draft.identity
          ),
          amount: Number(draft.value),
        }))
      );
      await save(updates, (update) => saved.add(update.key));
    } catch {
      setPrepareError(true);
    } finally {
      if (saved.size > 0)
        setDrafts((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(([key]) => !saved.has(key))
          )
        );
      setPreparing(false);
      submitting.current = false;
    }
  };
  const count = contributorCount ?? items.length;
  const countKey = direction === "given" ? "receivers" : "raters";
  const plural =
    new Intl.PluralRules(locale).select(count) === "one" ? "one" : "other";
  const footer = (
    <RatingEditorFooter
      matter={matter}
      formId={formId}
      editable={canManage}
      changed={changes.length > 0}
      before={before}
      after={validNumbers ? after : null}
      available={allowanceReady ? (available ?? 0) : null}
      busy={busy}
      canSave={canSave}
      onCancel={reset}
    >
      <RatingEditorErrors
        formId={formId}
        matter={matter}
        validNumbers={validNumbers}
        withinAllowance={withinAllowance}
        changed={changes.length > 0}
        available={available ?? 0}
        error={error}
        prepareError={prepareError}
      />
    </RatingEditorFooter>
  );

  return (
    <MobileWrapperDialog
      title={t(locale, "user.rate.listTitle", {
        matter,
        direction: t(locale, `user.rate.${direction}`),
      })}
      isOpen={isOpen}
      onClose={close}
      onEscape={escape}
      onAfterLeave={onClose}
      busy={busy}
      preserveFocusOnEscape={changes.length > 0}
      tabletModal
      desktopAlign="top"
      desktopTopOffset={10}
      noPadding
      fitVisualViewport
      showDragHandle
      enableDragToClose
      focusTitleOnOpen
      maxWidthClass="md:tw-max-w-[560px]"
      surfaceClassName="tw-bg-iron-950 [--mobile-wrapper-dialog-resting-height:88vh] md:[--mobile-wrapper-dialog-resting-height:80vh]"
      titleClassName="!tw-text-[17px] tw-font-semibold tw-text-iron-100"
      headerCloseButtonClassName="!tw-size-11 md:!tw-size-9"
      headerClassName="tw-pb-2 tw-pt-4"
      footer={canManage ? footer : undefined}
      showScrollbar
    >
      <form
        id={formId}
        ref={formRef}
        aria-busy={busy}
        className="tw-px-3 tw-pb-3 sm:tw-px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-text-xs tw-text-iron-400">
          <span>
            {t(locale, `user.profile.rep.contributors.${countKey}.${plural}`, {
              count: formatInteger(locale, count),
            })}
          </span>
          <RatingSortSelect
            matter="NIC"
            direction={direction}
            value={orderBy}
            onChange={changeOrder}
            disabled={busy}
            compact
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
          {items.map((row, index) => {
            const target = getRatingRecipient(row);
            const picture = identities[index]?.data?.pfp;
            const renderAmount = (original: number) => {
              const key = row.profile_id;
              if (!canManage)
                return (
                  <span
                    className={`${RATING_CONTRIBUTOR_AMOUNT_CLASS} ${original < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
                  >
                    {formatInteger(locale, original)}
                  </span>
                );
              const draft = drafts[key];
              const description =
                draft && !validNumbers ? `${formId}-invalid-number` : undefined;
              const limitDescription =
                draft && validNumbers && !withinAllowance
                  ? `${formId}-credit-limit`
                  : undefined;
              return (
                <RatingAmountInput
                  originalAmount={draft?.original ?? original}
                  value={draft?.value ?? String(original)}
                  aria-label={t(locale, "user.rate.amountFor", {
                    matter,
                    name: target.display,
                  })}
                  aria-invalid={
                    draft !== undefined &&
                    (!isRatingValue(draft.value) || !withinAllowance)
                  }
                  aria-describedby={description ?? limitDescription}
                  readOnly={busy || !allowanceReady}
                  onChange={(event) =>
                    updateDraft(
                      key,
                      {
                        identity: target.identity,
                        original: draft?.original ?? original,
                      },
                      event.currentTarget.value
                    )
                  }
                />
              );
            };
            return (
              <li key={row.profile_id} className={RATING_CONTRIBUTOR_ROW_CLASS}>
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
                {renderAmount(row.rating)}
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
            variant="ghost"
            size="sm"
            fullWidth
            className="tw-mt-4 tw-min-h-11 lg:tw-min-h-9"
            loading={query.isFetchingNextPage}
            disabled={busy}
            onClick={() => {
              void query.fetchNextPage();
            }}
          >
            {t(locale, "user.rate.loadMore")}
          </Button>
        )}
        {canManage && nicState.isError && (
          <RatingLoadState
            loading={false}
            error
            retry={() => {
              void nicState.refetch();
            }}
          />
        )}
      </form>
    </MobileWrapperDialog>
  );
}
