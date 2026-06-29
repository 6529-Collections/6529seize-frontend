"use client";

import Leaderboard from "@/components/leaderboard/Leaderboard";
import NetworkPageLayout from "@/components/network/NetworkPageLayout";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { LeaderboardFocus } from "@/types/enums";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TDH_VIEW_PARAM = "tdh_view";

function getTdhViewFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">
): ApiConsolidatedTdhView {
  return searchParams.get(TDH_VIEW_PARAM) === ApiConsolidatedTdhView.Unboosted
    ? ApiConsolidatedTdhView.Unboosted
    : ApiConsolidatedTdhView.Boosted;
}

function getFocusPath(focus: LeaderboardFocus): string {
  if (focus === LeaderboardFocus.INTERACTIONS) {
    return "/network/nerd/interactions";
  }

  return "/network/nerd/cards-collected";
}

function getFocusFromPathname(
  pathname: string,
  fallback: LeaderboardFocus
): LeaderboardFocus {
  if (pathname.includes("/interactions")) {
    return LeaderboardFocus.INTERACTIONS;
  }

  if (pathname.startsWith("/network/nerd")) {
    return LeaderboardFocus.TDH;
  }

  return fallback;
}

function getNextUrl(
  pathname: string,
  tdhView: ApiConsolidatedTdhView,
  searchParams: Pick<URLSearchParams, "toString">
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (tdhView === ApiConsolidatedTdhView.Unboosted) {
    params.set(TDH_VIEW_PARAM, ApiConsolidatedTdhView.Unboosted);
  } else {
    params.delete(TDH_VIEW_PARAM);
  }

  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export default function CommunityNerdPageClient({
  focus: initialFocus,
}: {
  focus: LeaderboardFocus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [focus, setFocus] = useState<LeaderboardFocus>(() =>
    getFocusFromPathname(pathname, initialFocus)
  );
  const tdhView = getTdhViewFromSearchParams(searchParams);

  useEffect(() => {
    setFocus(getFocusFromPathname(pathname, initialFocus));
  }, [pathname, initialFocus]);

  const handleSetFocus = (newFocus: LeaderboardFocus) => {
    setFocus(newFocus);
    globalThis.history.replaceState(
      null,
      "",
      getNextUrl(getFocusPath(newFocus), tdhView, searchParams)
    );
  };

  const handleSetTdhView = (newTdhView: ApiConsolidatedTdhView) => {
    router.replace(getNextUrl(getFocusPath(focus), newTdhView, searchParams), {
      scroll: false,
    });
  };

  return (
    <NetworkPageLayout>
      <div className="tw-mb-3 tw-flex tw-items-center">
        <Link
          href="/network"
          aria-label="Back to main Network view"
          className="tw-group -tw-ml-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform group-hover:-tw-translate-x-0.5"
          />
          <span>Network</span>
        </Link>
      </div>
      <Leaderboard
        focus={focus}
        setFocus={handleSetFocus}
        tdhView={tdhView}
        setTdhView={handleSetTdhView}
      />
    </NetworkPageLayout>
  );
}
