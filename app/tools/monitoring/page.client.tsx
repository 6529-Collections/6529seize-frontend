"use client";

import {
  CONTENT_PAGE_CONTAINER_CLASS,
  CONTENT_PAGE_MAIN_CLASS,
} from "@/components/about/AboutLayout";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useSetTitle } from "@/contexts/TitleContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getStructuredApiErrorStatus,
  getStructuredApiErrorCode,
} from "@/services/api/common-api";
import {
  fetchMonitoringSentryOverview,
  fetchMonitoringSentryHistory,
} from "@/services/api/monitoring-api";
import { ApiMonitoringSentryOverviewStatusEnum } from "@/generated/models/ApiMonitoringSentryOverview";
import type { ApiMonitoringSentryOverview } from "@/generated/models/ApiMonitoringSentryOverview";
import { useQuery } from "@tanstack/react-query";

import SentryOverview from "./sentry-overview";
import SentryHistory from "./sentry-history";

function canLoadHistory(
  enabled: boolean,
  accessGranted: boolean,
  overview: ApiMonitoringSentryOverview | undefined
) {
  return (
    enabled &&
    accessGranted &&
    overview?.status === ApiMonitoringSentryOverviewStatusEnum.Ready
  );
}

function getAccessErrorStatus(overviewError: unknown, historyError: unknown) {
  const historyStatus = getStructuredApiErrorStatus(historyError);
  if (historyStatus === 401 || historyStatus === 403) return historyStatus;
  return getStructuredApiErrorStatus(overviewError);
}

export default function MonitoringPageClient() {
  const locale = DEFAULT_LOCALE;
  const {
    connectedProfile,
    fetchingProfile,
    isAuthenticated,
    isDirectProfileSession,
    activeProfileProxy,
    requestAuth,
    setToast,
  } = useAuth();
  const { address, isWalletConnectionPending, seizeConnect } =
    useSeizeConnectContext();
  const hasSession = Boolean(address) && isAuthenticated === true;
  const isDirectSession =
    isDirectProfileSession === true && activeProfileProxy === null;
  const enabled =
    hasSession &&
    isDirectSession &&
    Boolean(connectedProfile?.id) &&
    !fetchingProfile &&
    !isWalletConnectionPending;
  const sessionKey = [
    address ?? null,
    connectedProfile?.id ?? null,
    activeProfileProxy?.id ?? null,
    isDirectProfileSession,
  ];
  const query = useQuery({
    queryKey: [QueryKey.MONITORING_SENTRY_OVERVIEW, ...sessionKey],
    queryFn: ({ signal }) => fetchMonitoringSentryOverview(signal),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: enabled ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
  const historyQuery = useQuery({
    queryKey: [QueryKey.MONITORING_SENTRY_HISTORY, ...sessionKey],
    queryFn: ({ signal }) => fetchMonitoringSentryHistory(signal),
    enabled: canLoadHistory(enabled, query.isSuccess, query.data),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: enabled ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
  useSetTitle(t(locale, "monitoring.title"));

  const status = getAccessErrorStatus(query.error, historyQuery.error);
  const pending = fetchingProfile || isWalletConnectionPending;
  const signInRequired = !hasSession || status === 401;
  const restricted =
    hasSession && (!isDirectSession || !connectedProfile?.id || status === 403);
  const checking = pending || (enabled && query.isPending);
  const allowed =
    enabled &&
    query.isSuccess &&
    !checking &&
    getStructuredApiErrorCode(historyQuery.error) !==
      "MONITORING_ACCESS_UNAVAILABLE";

  const reportError = () => {
    setToast({ message: t(locale, "monitoring.unavailable"), type: "error" });
  };
  const signIn = () => {
    if (!address) {
      seizeConnect();
      return;
    }
    void requestAuth({ serverRejected: status === 401 }).catch(reportError);
  };

  let content;
  if (checking) {
    content = <p role="status">{t(locale, "monitoring.checking")}</p>;
  } else if (signInRequired) {
    content = (
      <>
        <h2 className="tw-text-lg tw-font-semibold">
          {t(locale, "monitoring.signInTitle")}
        </h2>
        <p>{t(locale, "monitoring.signInDescription")}</p>
        <PrimaryButton loading={false} disabled={false} onClicked={signIn}>
          {t(locale, address ? "monitoring.signIn" : "monitoring.connect")}
        </PrimaryButton>
      </>
    );
  } else if (restricted) {
    content = (
      <>
        <h2 className="tw-text-lg tw-font-semibold">
          {t(locale, "monitoring.restrictedTitle")}
        </h2>
        <p>{t(locale, "monitoring.restrictedDescription")}</p>
      </>
    );
  } else if (allowed) {
    content = (
      <SentryOverview overview={query.data} locale={locale}>
        <SentryHistory
          history={historyQuery.data}
          loading={historyQuery.isPending}
          unavailable={historyQuery.isError}
          locale={locale}
          onRetry={() => {
            void historyQuery.refetch().catch(reportError);
          }}
        />
      </SentryOverview>
    );
  } else {
    content = (
      <>
        <p role="alert">{t(locale, "monitoring.unavailable")}</p>
        <PrimaryButton
          loading={false}
          disabled={!enabled}
          onClicked={() => {
            void Promise.all([query.refetch(), historyQuery.refetch()]).catch(
              reportError
            );
          }}
        >
          {t(locale, "monitoring.retry")}
        </PrimaryButton>
      </>
    );
  }

  return (
    <main className={CONTENT_PAGE_MAIN_CLASS}>
      <div className={CONTENT_PAGE_CONTAINER_CLASS}>
        <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold tw-text-iron-50">
          {t(locale, "monitoring.title")}
        </h1>
        <section
          aria-label={t(locale, "monitoring.title")}
          aria-live="polite"
          className="tw-max-w-5xl tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-300"
        >
          {content}
        </section>
      </div>
    </main>
  );
}
