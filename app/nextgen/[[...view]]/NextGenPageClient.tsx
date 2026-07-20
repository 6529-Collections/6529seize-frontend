"use client";

import NextGenComponent from "@/components/nextGen/collections/NextGen";
import NextgenAboutComponent from "@/components/nextGen/collections/NextGenAbout";
import NextgenArtistsComponent from "@/components/nextGen/collections/NextGenArtists";
import NextgenCollectionsComponent from "@/components/nextGen/collections/NextGenCollections";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import { useTitle } from "@/contexts/TitleContext";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenView } from "@/types/enums";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getNextgenTitle } from "../title-utils";
import { getNextGenView } from "./view-utils";

function getPageTitle(view?: NextgenView): string {
  return getNextgenTitle(view, "NextGen");
}

export default function NextGenPageClient({
  featuredCollection,
  initialView,
}: {
  readonly featuredCollection: NextGenCollection | null;
  readonly initialView?: NextgenView | undefined;
}) {
  const { setTitle } = useTitle();

  const [view, setView] = useState<NextgenView | undefined>(initialView);

  const updateView = (newView?: NextgenView) => {
    setView(newView);
    setTitle(getPageTitle(newView));
    const newPath =
      newView !== undefined ? `/nextgen/${newView.toLowerCase()}` : "/nextgen";
    window.history.pushState({ view: newView }, "", newPath);
  };

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const pathView = window.location.pathname.split("/")[2];
      const historyState: unknown = e.state;
      const stateView =
        typeof historyState === "object" &&
        historyState !== null &&
        "view" in historyState &&
        typeof historyState.view === "string"
          ? historyState.view
          : undefined;
      const newView = stateView ?? pathView;
      const nextView =
        newView !== undefined ? getNextGenView(newView) : undefined;
      setView(nextView);
      setTitle(getPageTitle(nextView));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setTitle]);

  return (
    <main className={`${NEXTGEN_PAGE_FRAME_CLASSNAME} tw-pb-12`}>
      {featuredCollection !== null && featuredCollection.id > 0 ? (
        <>
          <NextGenNavigationHeader view={view} setView={updateView} />
          {!view && (
            <NextGenComponent
              collection={featuredCollection}
              setView={updateView}
            />
          )}
          {view && (
            <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-6 md:tw-px-6 lg:tw-px-8">
              {view === NextgenView.COLLECTIONS && (
                <NextgenCollectionsComponent />
              )}
              {view === NextgenView.ARTISTS && <NextgenArtistsComponent />}
              {view === NextgenView.ABOUT && <NextgenAboutComponent />}
            </div>
          )}
        </>
      ) : (
        <div className="tw-flex tw-min-h-[calc(100vh-120px)] tw-items-center tw-justify-center tw-p-6">
          <Image
            unoptimized
            width={882}
            height={882}
            className="tw-h-auto tw-w-48 tw-max-w-[50vw]"
            src="/question.png"
            alt="NextGen collection unavailable"
          />
        </div>
      )}
    </main>
  );
}
