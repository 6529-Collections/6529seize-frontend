"use client";

import {
  getCollectionView,
  getContentViewKeyByValue,
} from "@/app/nextgen/collection/[collection]/page-utils";
import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { useTitle } from "@/contexts/TitleContext";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenCollectionView } from "@/types/enums";
import { useEffect, useState } from "react";
import styles from "../NextGen.module.css";
import NextGenNavigationHeader from "../NextGenNavigationHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import NextGenCollectionArtist from "./NextGenCollectionArtist";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";

export function printViewButton(
  currentView: NextgenCollectionView,
  v: NextgenCollectionView,
  setView: (v: NextgenCollectionView) => void
) {
  return (
    <button
      onClick={() => setView(v)}
      className={`tw-cursor-pointer tw-border-0 tw-bg-transparent !tw-p-0 tw-font-[inherit] tw-text-inherit tw-no-underline tw-outline-[inherit] hover:tw-bg-transparent hover:tw-text-[#9a9a9a] focus:tw-bg-transparent focus:tw-text-[#9a9a9a] active:tw-bg-transparent active:tw-text-[#9a9a9a] ${
        v === currentView ? styles["nextgenTokenDetailsLinkSelected"] : ""
      }`}
    >
      <h4
        className={
          v === currentView
            ? "tw-text-white"
            : "tw-cursor-pointer tw-text-[#9a9a9a]"
        }
      >
        {v}
      </h4>
    </button>
  );
}

export default function NextGenCollectionComponent({
  collection,
  initialView,
}: {
  readonly collection: NextGenCollection;
  readonly initialView: NextgenCollectionView;
}) {
  useShallowRedirect(collection.name);
  const { setTitle } = useTitle();

  const [view, setView] = useState<NextgenCollectionView>(initialView);
  useEffect(() => {
    const viewTitle =
      view !== NextgenCollectionView.OVERVIEW ? ` | ${view}` : "";
    setTitle(`${collection.name}${viewTitle} | NextGen`);
  }, [collection.name, view, setTitle]);

  const updateView = (newView: NextgenCollectionView) => {
    setView(newView);
    let path =
      newView === NextgenCollectionView.OVERVIEW
        ? ""
        : `/${getContentViewKeyByValue(newView).toLowerCase()}`;
    path = path.replaceAll(" ", "-").replaceAll("_", "-");
    const newPath = `/nextgen/collection/${formatNameForUrl(
      collection.name
    )}${path}`;
    window.history.pushState({ view: newView }, "", newPath);
  };

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        const newView = getCollectionView(e.state.view);
        setView(newView);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <NextGenNavigationHeader />
      {collection.mint_count > 0 && (
        <NextGenCollectionSlideshow collection={collection} />
      )}
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-2 tw-pt-4 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <NextGenCollectionHeader collection={collection} show_links={true} />
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-12">
          <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-6 tw-px-3">
            {printViewButton(view, NextgenCollectionView.OVERVIEW, updateView)}
            {printViewButton(view, NextgenCollectionView.ABOUT, updateView)}
            {printViewButton(
              view,
              NextgenCollectionView.PROVENANCE,
              updateView
            )}
            {printViewButton(
              view,
              NextgenCollectionView.TOP_TRAIT_SETS,
              updateView
            )}
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionDetails collection={collection} view={view} />
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-6">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionArt
              collection={collection}
              show_view_all={true}
            />
          </div>
        </div>
      </div>
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-6 tw-pt-6 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h4>About the Artist</h4>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionArtist collection={collection} />
          </div>
        </div>
      </div>
    </>
  );
}
