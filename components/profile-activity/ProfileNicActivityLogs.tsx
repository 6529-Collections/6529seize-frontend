"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import type { ApiProfileActivityLogPage } from "@/generated/models/ApiProfileActivityLogPage";
import { commonApiFetch } from "@/services/api/common-api";
import type { ActivityLogParamsConverted } from "./ProfileActivityLogs";
import ProfileActivityLogsResults from "./ProfileActivityLogsResults";
import ProfileActivityLogsSkeleton from "./ProfileActivityLogsSkeleton";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface Props {
  readonly params: ActivityLogParamsConverted;
  readonly user: string | null;
}

type NicPage = CountlessPage<ProfileActivityLog> &
  Required<Pick<ApiProfileActivityLogPage, "next_cursor">>;

export default function ProfileNicActivityLogs(props: Props) {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const pendingViewer = Boolean(address && fetchingProfile);
  const viewer = JSON.stringify([
    address ?? null,
    isAuthenticated && hasValidWalletAuth !== false
      ? connectedProfile?.id
      : null,
    activeProfileProxy?.id ?? null,
  ]);
  // A changed filter or viewer starts a new traversal, including its page state.
  const scope = JSON.stringify({ ...props.params, page: undefined, viewer });
  if (pendingViewer) return <ProfileActivityLogsSkeleton />;
  return <NicActivityPages key={scope} {...props} scope={scope} />;
}

function NicActivityPages({
  params,
  user,
  scope,
}: Props & { readonly scope: string }) {
  const locale = useBrowserLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const query = useInfiniteQuery({
    queryKey: [QueryKey.PROFILE_LOGS, { nic: scope }],
    initialPageParam: { cursor: null as string | null, page: 1 },
    queryFn: async ({ pageParam, signal }) => {
      const result = await commonApiFetch<NicPage, ActivityLogParamsConverted>({
        endpoint: "profile-logs",
        params: {
          ...params,
          page: String(pageParam.page),
          ...(pageParam.cursor ? { cursor: pageParam.cursor } : {}),
        },
        signal,
      });
      // An older backend ignores unknown filters. Never display its mixed feed
      // as NIC while the dependent API is unavailable.
      if (
        !("next_cursor" in result) ||
        result.page !== pageParam.page ||
        (pageParam.page > 1 && result.data.length === 0) ||
        (result.next &&
          (!result.next_cursor ||
            result.data.length !== Number(params.page_size)))
      ) {
        throw new Error("NIC activity cursor response is unavailable");
      }
      return result;
    },
    getNextPageParam: (lastPage) =>
      lastPage.next && lastPage.next_cursor
        ? { cursor: lastPage.next_cursor, page: lastPage.page + 1 }
        : undefined,
  });
  const pages = query.data?.pages;
  const pageNumber = Math.min(currentPage, pages?.length ?? 1);
  const changePage = async (page: number) => {
    if (query.isFetching || page < 1) return;
    if (page <= (pages?.length ?? 0)) {
      setCurrentPage(page);
    } else if (query.hasNextPage && page === pageNumber + 1) {
      const result = await query.fetchNextPage();
      if (!result.isError && (result.data?.pages.length ?? 0) >= page) {
        setCurrentPage(page);
      }
    }
  };
  if (query.isError && !pages) {
    return (
      <div
        role="alert"
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-4 tw-text-sm tw-text-iron-300 ${user ? "tw-px-2 sm:tw-px-3" : ""}`}
      >
        <span>{t(locale, "profileActivity.loadError")}</span>
        <Button
          variant="secondary"
          size="sm"
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t(locale, "profileActivity.retry")}
        </Button>
      </div>
    );
  }
  return (
    <ProfileActivityLogsResults
      logs={pages?.[pageNumber - 1]}
      user={user}
      currentPage={pageNumber}
      setCurrentPage={(page) => {
        void changePage(page);
      }}
      loading={query.isFetching}
    />
  );
}
