"use client";

import styles from "@/styles/Home.module.scss";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import NextGenCollectionComponent from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { NextGenCollection } from "@/entities/INextgen";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSetTitle } from "@/contexts/TitleContext";
import { getContentViewKeyByValue } from "../page-utils";
import { useShallowRedirect } from "../useShallowRedirect";

export default function NextGenCollectionPageClient({
  collection,
  view: initialView,
}: {
  readonly collection: NextGenCollection;
  readonly view: ContentView;
}) {
  const setTitle = useSetTitle();
  const router = useRouter();
  const searchParams = useSearchParams();

  useShallowRedirect(collection.name);

  const [view, setView] = useState<ContentView>(initialView);

  useEffect(() => {
    const viewTitle = view !== ContentView.OVERVIEW ? ` | ${view}` : "";
    setTitle(`${collection.name}${viewTitle} | NextGen`);
  }, [searchParams, collection.name, view, setTitle]);

  const updateView = (newView: ContentView) => {
    setView(newView);
    let path =
      newView === ContentView.OVERVIEW
        ? "/"
        : `/${getContentViewKeyByValue(newView).toLowerCase()}`;
    path = path.replaceAll(" ", "-").replaceAll("_", "-");
    const newPath = `/nextgen/collection/${formatNameForUrl(
      collection.name
    )}${path}`;
    router.push(newPath);
  };

  return (
    <main className={styles.main}>
      <NextGenCollectionComponent
        collection={collection}
        view={view}
        setView={updateView}
      />
    </main>
  );
}
