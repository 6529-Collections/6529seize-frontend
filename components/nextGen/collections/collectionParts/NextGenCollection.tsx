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
import styles from "../NextGen.module.scss";
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
      className={`btn-link decoration-none ${
        v === currentView ? styles["nextgenTokenDetailsLinkSelected"] : ""
      }`}
    >
      <h4
        className={
          v === currentView ? "font-color" : "font-color-h cursor-pointer"
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
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-3 pb-2">
        <NextGenCollectionHeader collection={collection} show_links={true} />
        <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-5">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 d-flex gap-4">
            {printViewButton(
              view,
              NextgenCollectionView.OVERVIEW,
              updateView
            )}
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
        <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionDetails collection={collection} view={view} />
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionArt
              collection={collection}
              show_view_all={true}
            />
          </div>
        </div>
      </div>
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-4 pb-4">
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <h4>About the Artist</h4>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionArtist collection={collection} />
          </div>
        </div>
      </div>
    </>
  );
}
