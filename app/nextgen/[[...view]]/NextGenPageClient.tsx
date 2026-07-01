"use client";

import NextGenComponent from "@/components/nextGen/collections/NextGen";
import NextgenAboutComponent from "@/components/nextGen/collections/NextGenAbout";
import NextgenArtistsComponent from "@/components/nextGen/collections/NextGenArtists";
import NextgenCollectionsComponent from "@/components/nextGen/collections/NextGenCollections";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { useTitle } from "@/contexts/TitleContext";
import type { NextGenCollection } from "@/entities/INextgen";
import styles from "@/styles/Home.module.scss";
import { NextgenView } from "@/types/enums";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getNextGenView } from "./view-utils";

export default function NextGenPageClient({
  featuredCollection,
  initialView,
}: {
  readonly featuredCollection: NextGenCollection;
  readonly initialView?: NextgenView | undefined;
}) {
  const { setTitle } = useTitle();

  const [collection] = useState<NextGenCollection>(featuredCollection);
  const [view, setView] = useState<NextgenView | undefined>(initialView);

  useEffect(() => {
    setTitle("NextGen " + (view ?? ""));
  }, [setTitle, view]);

  const updateView = (newView?: NextgenView) => {
    setView(newView);
    const newPath = newView ? `/nextgen/${newView.toLowerCase()}` : "/nextgen";
    window.history.pushState({ view: newView }, "", newPath);
  };

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        const newView = getNextGenView(e.state.view);
        setView(newView);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const mainClassName = [
    "tailwind-scope",
    styles["main"],
    "tw-border",
    "tw-border-y-0",
    "tw-border-l-0",
    "tw-border-solid",
    "tw-border-iron-800",
    "tw-bg-[#0D0D0F]",
  ]
    .filter((className): className is string => Boolean(className))
    .join(" ");

  return (
    <main className={mainClassName}>
      {collection?.id ? (
        <>
          <NextGenNavigationHeader view={view} setView={updateView} />
          {!view && (
            <NextGenComponent collection={collection} setView={updateView} />
          )}
          {view && (
            <div className={`tw-w-full tw-max-w-none ${styles["main"]}`}>
              <div className="tw-flex tw-flex-wrap -tw-mx-3 d-flex align-items-center">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                  <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pb-4">
                    <div className="tw-flex tw-flex-wrap -tw-mx-3">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        {view === NextgenView.COLLECTIONS && (
                          <NextgenCollectionsComponent />
                        )}
                        {view === NextgenView.ARTISTS && (
                          <NextgenArtistsComponent />
                        )}
                        {view === NextgenView.ABOUT && (
                          <NextgenAboutComponent />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles["nextGenQuestion"]}>
          <Image
            unoptimized
            width={0}
            height={0}
            style={{ height: "auto", width: "25vw" }}
            src="/question.png"
            alt="questionmark"
          />
        </div>
      )}
    </main>
  );
}
