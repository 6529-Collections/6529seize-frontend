"use client";

import {
  getCollectionViewFromPathname,
  getContentViewKeyByValue,
  getNextgenCollectionDocumentTitle,
} from "@/app/nextgen/collection/[collection]/page-utils";
import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { useTitle } from "@/contexts/TitleContext";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenCollectionView } from "@/types/enums";
import { useEffect, useState } from "react";
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
  const isCurrent = v === currentView;

  return (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-current={isCurrent ? "page" : undefined}
      className={`tw-inline-flex tw-min-h-12 tw-items-center tw-justify-center tw-whitespace-nowrap tw-border-0 tw-border-b-2 tw-border-solid tw-bg-transparent tw-px-1 tw-py-3 tw-text-sm tw-font-semibold tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-bg-white/10 sm:tw-text-base ${
        isCurrent
          ? "tw-border-primary-400 tw-text-white"
          : "tw-border-transparent tw-text-iron-400 hover:tw-text-white"
      }`}
    >
      {v}
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
    setTitle(getNextgenCollectionDocumentTitle(collection.name, view));
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
    const onPopState = () => {
      // A collection slug can itself be a view name, so only parse the
      // segment after the slug instead of reading the last path segment.
      const restoredView = getCollectionViewFromPathname(
        globalThis.location.pathname
      );
      setView(restoredView);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <NextGenNavigationHeader />
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
        <section className="tw-py-6 sm:tw-py-8">
          <NextGenCollectionHeader
            collection={collection}
            show_links={true}
            contained={false}
            compact={true}
          />
        </section>

        {collection.mint_count > 0 && (
          <section aria-label={`${collection.name} slideshow`}>
            <NextGenCollectionSlideshow collection={collection} />
          </section>
        )}

        <nav
          aria-label={`${collection.name} sections`}
          className="tw-mt-6 tw-overflow-x-auto tw-border-0 tw-border-b tw-border-solid tw-border-white/15"
        >
          <div className="-tw-mb-px tw-inline-flex tw-min-w-max tw-gap-6 sm:tw-gap-8">
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
        </nav>

        <section className="tw-pt-6">
          <NextGenCollectionDetails collection={collection} view={view} />
        </section>

        <section className="tw-pt-10 sm:tw-pt-12">
          <NextGenCollectionArt collection={collection} show_view_all={true} />
        </section>

        <section className="tw-pt-10 sm:tw-pt-12">
          <h2 className="tw-mb-5 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
            About the Artist
          </h2>
          <NextGenCollectionArtist collection={collection} headingLevel={3} />
        </section>
      </div>
    </>
  );
}
