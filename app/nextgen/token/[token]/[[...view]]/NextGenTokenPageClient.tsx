"use client";

import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import NextGenTokenComponent from "@/components/nextGen/collections/nextgenToken/NextGenToken";
import NextGenTokenOnChain from "@/components/nextGen/collections/NextGenTokenOnChain";
import { useNftMarketRoute } from "@/hooks/useNftMarketRoute";
import { usePathname, useSearchParams } from "next/navigation";
import { useTitle } from "@/contexts/TitleContext";
import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { NextgenCollectionView } from "@/types/enums";
import { useEffect } from "react";
import { getNextgenTitle } from "../../../title-utils";
import {
  getNextgenTokenView,
  getNextgenTokenViewSegment,
} from "@/components/nextGen/collections/nextgenToken/nextgen-token-view.helpers";

function getTokenViewFromPathname(pathname: string): NextgenCollectionView {
  const viewSegment = pathname.split("/").filter(Boolean)[3] ?? "";
  return getNextgenTokenView(viewSegment);
}

export default function NextGenTokenPageClient({
  tokenId,
  token,
  traits,
  tokenCount,
  collection,
  returnTo,
}: {
  readonly tokenId: number;
  readonly token: NextGenToken | null;
  readonly traits: NextGenTrait[];
  readonly tokenCount: number;
  readonly collection: NextGenCollection;
  readonly returnTo?: string | null | undefined;
}) {
  const { setTitle } = useTitle();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathView = getTokenViewFromPathname(pathname);
  const artworkPath = "/nextgen/token/" + tokenId;
  const isMarketLink =
    pathView === NextgenCollectionView.LISTINGS_AND_OFFERS ||
    searchParams.get("focus") === "listings-and-offers" ||
    Boolean(searchParams.get("order"));
  const { redirectToArtwork } = useNftMarketRoute(
    pathname,
    searchParams,
    isMarketLink ? artworkPath : undefined
  );
  const tokenView = redirectToArtwork ? NextgenCollectionView.ABOUT : pathView;

  useEffect(() => {
    const baseTitle = token?.name ?? `${collection.name} - #${tokenId}`;
    const viewDisplay =
      tokenView !== NextgenCollectionView.ABOUT ? tokenView : "";
    setTitle(getNextgenTitle(viewDisplay, baseTitle));
  }, [tokenView, token?.name, collection.name, tokenId, setTitle]);

  const updateView = (newView?: NextgenCollectionView) => {
    const nextView = newView ?? NextgenCollectionView.ABOUT;
    if (nextView === tokenView) {
      return;
    }

    let newPath = artworkPath;
    if (nextView !== NextgenCollectionView.ABOUT) {
      newPath += `/${getNextgenTokenViewSegment(nextView)}`;
    }
    newPath += globalThis.location.search;
    globalThis.history.pushState({ view: nextView }, "", newPath);
  };

  return (
    <main className={NEXTGEN_PAGE_FRAME_CLASSNAME}>
      <NextGenNavigationHeader />
      {token ? (
        <NextGenTokenComponent
          collection={collection}
          token={token}
          traits={traits}
          tokenCount={tokenCount}
          view={tokenView}
          setView={updateView}
          returnTo={returnTo}
        />
      ) : (
        <NextGenTokenOnChain collection={collection} token_id={tokenId} />
      )}
    </main>
  );
}
