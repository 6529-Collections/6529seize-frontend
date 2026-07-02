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
              <div className="tw-flex tw-items-center -tw-mx-3 tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  <div className="tw-pb-6 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
