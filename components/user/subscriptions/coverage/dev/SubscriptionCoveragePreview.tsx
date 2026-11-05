"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import UserPageSubscriptionsSettings from "../../UserPageSubscriptionsSettings";
import UserPageSubscriptionsUpcoming from "../../UserPageSubscriptionsUpcoming";
import UserPageSubscriptionsTopUp from "../../UserPageSubscriptionsTopUp";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsBalance from "../../UserPageSubscriptionsBalance";
import SubscriptionCoverageSummary from "../SubscriptionCoverageSummary";
import SubscriptionCoverageNotice from "../SubscriptionCoverageNotice";
import { getSubscriptionCoveragePresentation } from "../subscriptionCoverage.helpers";
import {
  coveragePreviewFixtures,
  mintingTodayPreview,
  oneFundedDropPreview,
} from "./coveragePreviewFixtures";
import SubscriptionTopUpMock from "./SubscriptionTopUpMock";
import MintingTodayPreview from "./MintingTodayPreview";

type PreviewState =
  | Status
  | "one-funded"
  | "loading"
  | "error"
  | "stale"
  | "minting-today";
const states = [
  Status.Covered,
  Status.EarlyWarning,
  Status.RunningLow,
  Status.ActionRequired,
  Status.NotSetUp,
  Status.NoUpcomingSelections,
  Status.NoCurrentEligibility,
  Status.Unknown,
];

type Preview = {
  coverage: ApiSubscriptionCoverage | undefined;
  details: SubscriptionDetails | undefined;
  owner: boolean;
  state: PreviewState;
  showSampleNotice: () => void;
  openTopUp: () => void;
  topUpOpen: boolean;
};
const PreviewContext = createContext<Preview | null>(null);

// This provider and its adapters are loaded only in development. They never
// change the real profile's authorization, query cache, or API data.
export function SubscriptionPreviewProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = useBrowserLocale();
  const auth = useContext(AuthContext);
  const [enabled] = useState(
    () =>
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) &&
      new URLSearchParams(window.location.search).get("coveragePreview") === "1"
  );
  const [state, setState] = useState<PreviewState>(Status.Covered);
  const [owner, setOwner] = useState(true);
  const [notice, setNotice] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const openTopUp = useCallback(() => setTopUpOpen(true), []);
  const showSampleNotice = useCallback(
    () => setNotice("Preview only. No account changes or payments are made."),
    []
  );
  const coverage =
    state === "loading" || state === "error"
      ? undefined
      : state === "minting-today"
        ? mintingTodayPreview
        : state === "stale"
          ? coveragePreviewFixtures[Status.Covered]
          : state === "one-funded"
            ? oneFundedDropPreview
            : coveragePreviewFixtures[state];
  const preview = useMemo<Preview>(
    () => ({
      coverage,
      owner,
      state,
      showSampleNotice,
      openTopUp,
      topUpOpen,
      details: coverage
        ? {
            consolidation_key: coverage.consolidation_key,
            last_update:
              coverage.mode === ApiSubscriptionCoverageMode.Automatic
                ? Date.parse("2026-02-20T23:01:00Z")
                : 0,
            balance: Number(coverage.balance_eth),
            automatic: coverage.mode === ApiSubscriptionCoverageMode.Automatic,
            subscribe_all_editions: coverage.subscribe_all_editions ?? false,
            subscription_eligibility_count: coverage.eligibility_count ?? 0,
          }
        : undefined,
    }),
    [coverage, owner, state, showSampleNotice, openTopUp, topUpOpen]
  );
  // Existing switches authenticate before saving. Keep that boundary closed
  // for sample controls, even when the real connected account owns the page.
  const previewAuth = useMemo(
    () => ({
      ...auth,
      requestAuth: async () => {
        showSampleNotice();
        return { success: false };
      },
    }),
    [auth, showSampleNotice]
  );

  const controlsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = controlsRef.current;
    const selected = container?.querySelector<HTMLElement>(
      '[aria-pressed="true"]'
    );
    if (container && selected) {
      const left = selected.offsetLeft - container.offsetLeft;
      if (
        left < container.scrollLeft ||
        left + selected.offsetWidth >
          container.scrollLeft + container.clientWidth
      ) {
        container.scrollLeft = left;
      }
    }
  }, [state]);

  if (!enabled) return children;

  const exitUrl = new URL(window.location.href);
  exitUrl.searchParams.delete("coveragePreview");
  exitUrl.hash = "profile-subscriptions-overview";

  const options: { value: PreviewState; label: string }[] = [
    { value: "minting-today", label: "Minting Today" },
    ...states.map((status) => ({
      value: status,
      label: getSubscriptionCoveragePresentation(locale, status).label,
    })),
    { value: "one-funded", label: "Action required · 1 funded" },
    { value: "loading", label: "Loading" },
    { value: "error", label: "Could not load" },
    { value: "stale", label: "Refresh failed" },
  ];
  const controls = (
    <div className="tw-relative tw-flex tw-min-w-0 tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1 tw-shadow-lg">
      <span className="tw-shrink-0 tw-px-1 tw-text-[10px] tw-font-medium tw-leading-3 tw-text-primary-300">
        PREVIEW
        <span className="tw-hidden sm:tw-inline">
          <br />
          Sample data
        </span>
      </span>
      <div
        ref={controlsRef}
        role="group"
        aria-label="Preview coverage state"
        className="tw-flex tw-min-w-0 tw-flex-1 tw-gap-1 tw-overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      >
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-pressed={state === option.value}
            onClick={() => {
              setState(option.value);
              setNotice("");
            }}
            className={`tw-min-h-8 tw-shrink-0 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${state === option.value ? "tw-bg-iron-100 tw-text-iron-950" : "tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Toggle preview perspective"
        aria-pressed={owner}
        onClick={() => {
          setOwner(!owner);
          setNotice("");
        }}
        className="tw-min-h-8 tw-shrink-0 tw-rounded-md tw-border-0 tw-bg-iron-800 tw-px-2 tw-text-xs tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
      >
        {owner ? "Owner" : "Visitor"}
      </button>
      <a
        href={exitUrl.pathname + exitUrl.search + exitUrl.hash}
        aria-label="Exit preview"
        className="tw-inline-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <XMarkIcon className="tw-size-4" aria-hidden="true" />
      </a>
      {notice && (
        <p
          role="status"
          className="tw-absolute tw-inset-x-0 tw-top-full tw-z-10 tw-m-0 tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-text-xs tw-text-primary-300"
        >
          {notice}
        </p>
      )}
      <span className="tw-sr-only">
        Sample coverage and settings. History and the airdrop address belong to
        the actual profile. Exit preview to return to the real account view.
      </span>
    </div>
  );

  return (
    <PreviewContext.Provider value={preview}>
      <AuthContext.Provider value={previewAuth}>
        <div
          className="tw-relative tw-min-w-0 tw-pt-4"
          onClickCapture={(event) => {
            const link =
              event.target instanceof Element
                ? event.target.closest(
                    'a[href="#profile-subscriptions-top-up"], a[href^="/safe-collecting/register-delegation"]'
                  )
                : null;
            if (link) {
              event.preventDefault();
              event.stopPropagation();
              if (link.getAttribute("href") === "#profile-subscriptions-top-up")
                openTopUp();
              else showSampleNotice();
            }
          }}
        >
          <div className="tw-absolute tw-inset-x-0 -tw-top-8 tw-z-50">
            {controls}
          </div>
          {children}
        </div>
        <SubscriptionTopUpMock
          coverage={coverage}
          isOpen={topUpOpen && owner}
          onClose={() => setTopUpOpen(false)}
        />
      </AuthContext.Provider>
    </PreviewContext.Provider>
  );
}

export function SubscriptionCoverageNoticePreview(
  props: ComponentProps<typeof SubscriptionCoverageNotice>
) {
  const preview = useContext(PreviewContext);
  if (!preview) return <SubscriptionCoverageNotice {...props} />;
  return (
    <SubscriptionCoverageNotice
      show={preview.state === "stale"}
      onRefresh={preview.owner ? preview.showSampleNotice : undefined}
    />
  );
}

export default function SubscriptionCoveragePreview(
  props: ComponentProps<typeof SubscriptionCoverageSummary>
) {
  const locale = useBrowserLocale();
  const preview = useContext(PreviewContext);
  if (!preview) return <SubscriptionCoverageSummary {...props} />;
  const { coverage, owner, state, showSampleNotice, openTopUp, topUpOpen } =
    preview;
  return (
    <SubscriptionCoverageSummary
      coverage={coverage}
      isLoading={state === "loading"}
      isOwner={owner}
      upcomingTokenIds={props.upcomingTokenIds}
      action={
        <UserPageSubscriptionsBalance
          coverage={coverage}
          details={undefined}
          fetching={state === "loading"}
          refresh={showSampleNotice}
          show_refresh={owner}
        />
      }
      topUpAction={
        owner && (
          <Button
            variant="primary"
            size={null}
            type="button"
            id="subscription-top-up-opener"
            aria-haspopup="dialog"
            aria-expanded={topUpOpen}
            aria-controls="profile-subscriptions-top-up"
            onClick={openTopUp}
            className="tw-min-h-11 tw-w-full tw-px-4 tw-py-1.5 tw-text-[15px] sm:tw-min-h-9 sm:tw-w-auto md:tw-text-sm"
          >
            {t(locale, "subscriptions.page.topUpTitle")}
          </Button>
        )
      }
    />
  );
}

export function SubscriptionSettingsPreview(
  props: ComponentProps<typeof UserPageSubscriptionsSettings>
) {
  const preview = useContext(PreviewContext);
  return (
    <UserPageSubscriptionsSettings
      {...props}
      {...(preview
        ? {
            details: preview.details,
            readonly: !preview.owner,
            refresh: preview.showSampleNotice,
          }
        : {})}
    />
  );
}

export function SubscriptionUpcomingPreview(
  props: ComponentProps<typeof UserPageSubscriptionsUpcoming>
) {
  const preview = useContext(PreviewContext);
  const subscriptions = useMemo(
    () =>
      preview
        ? props.memes_subscriptions.map((subscription) => ({
            ...subscription,
            subscribed: preview.details?.automatic ?? false,
            subscribed_count:
              preview.details?.subscription_eligibility_count || 1,
          }))
        : props.memes_subscriptions,
    [preview?.details, props.memes_subscriptions]
  );
  if (preview?.state === "minting-today") {
    return (
      <MintingTodayPreview
        {...props}
        details={preview.details}
        readonly={!preview.owner}
        refresh={preview.showSampleNotice}
        coverage={preview.coverage}
      />
    );
  }
  return (
    <UserPageSubscriptionsUpcoming
      {...props}
      {...(preview
        ? {
            details: preview.details,
            readonly: !preview.owner,
            refresh: preview.showSampleNotice,
            coverage: preview.coverage,
            memes_subscriptions: subscriptions,
          }
        : {})}
    />
  );
}

export function SubscriptionTopUpPreview(
  props: ComponentProps<typeof UserPageSubscriptionsTopUp>
) {
  const preview = useContext(PreviewContext);
  // Never mount real wallet/payment hooks in sample mode.
  return preview ? null : <UserPageSubscriptionsTopUp {...props} />;
}
