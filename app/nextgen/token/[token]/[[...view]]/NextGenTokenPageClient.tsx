"use client";

import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import NextGenTokenComponent from "@/components/nextGen/collections/nextgenToken/NextGenToken";
import NextGenTokenOnChain from "@/components/nextGen/collections/NextGenTokenOnChain";
import { useTitle } from "@/contexts/TitleContext";
import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { NextgenCollectionView } from "@/types/enums";
import { useEffect, useState } from "react";
import { getNextgenTitle } from "../../../title-utils";

function getTokenViewFromPathname(pathname: string): NextgenCollectionView {
  const viewSegment = pathname.split("/").filter(Boolean)[3] ?? "";
  const normalizedView = viewSegment.toLowerCase().replaceAll("-", " ");
  const matchedView = [
    NextgenCollectionView.PROVENANCE,
    NextgenCollectionView.DISPLAY_CENTER,
    NextgenCollectionView.RARITY,
  ].find((view) => view.toLowerCase() === normalizedView);

  return matchedView ?? NextgenCollectionView.ABOUT;
}

export default function NextGenTokenPageClient({
  tokenId,
  token,
  traits,
  tokenCount,
  collection,
  view: initialView,
}: {
  readonly tokenId: number;
  readonly token: NextGenToken | null;
  readonly traits: NextGenTrait[];
  readonly tokenCount: number;
  readonly collection: NextGenCollection;
  readonly view: NextgenCollectionView;
}) {
  const { setTitle } = useTitle();
  const [tokenView, setTokenView] =
    useState<NextgenCollectionView>(initialView);

  useEffect(() => {
    const handlePopState = () => {
      setTokenView(getTokenViewFromPathname(globalThis.location.pathname));
    };

    globalThis.addEventListener("popstate", handlePopState);
    return () => globalThis.removeEventListener("popstate", handlePopState);
  }, []);

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

    let newPath = `/nextgen/token/${tokenId}`;
    if (nextView !== NextgenCollectionView.ABOUT) {
      newPath += `/${nextView.toLowerCase().replaceAll(" ", "-")}`;
    }
    setTokenView(nextView);
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
        />
      ) : (
        <NextGenTokenOnChain collection={collection} token_id={tokenId} />
      )}
    </main>
  );
}
