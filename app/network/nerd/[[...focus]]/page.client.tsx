"use client";

import Leaderboard from "@/components/leaderboard/Leaderboard";
import NetworkPageLayout from "@/components/network/NetworkPageLayout";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { LeaderboardFocus } from "@/types/enums";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  if (pathname.includes("/cards-collected")) {
    return LeaderboardFocus.TDH;
  }

  if (pathname === "/network/nerd") {
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
  const focus = getFocusFromPathname(pathname, initialFocus);
  const tdhView = getTdhViewFromSearchParams(searchParams);

  const handleSetFocus = (newFocus: LeaderboardFocus) => {
    router.replace(getNextUrl(getFocusPath(newFocus), tdhView, searchParams), {
      scroll: false,
    });
  };

  const handleSetTdhView = (newTdhView: ApiConsolidatedTdhView) => {
    router.replace(getNextUrl(getFocusPath(focus), newTdhView, searchParams), {
      scroll: false,
    });
  };

  return (
    <NetworkPageLayout>
      <Leaderboard
        focus={focus}
        setFocus={handleSetFocus}
        tdhView={tdhView}
        setTdhView={handleSetTdhView}
      />
    </NetworkPageLayout>
  );
}
