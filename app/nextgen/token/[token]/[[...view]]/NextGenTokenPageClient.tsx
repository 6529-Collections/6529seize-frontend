"use client";

import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import NextGenTokenComponent from "@/components/nextGen/collections/nextgenToken/NextGenToken";
import NextGenTokenOnChain from "@/components/nextGen/collections/NextGenTokenOnChain";
import { useTitle } from "@/contexts/TitleContext";
import {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import styles from "@/styles/Home.module.scss";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  readonly view: ContentView;
}) {
  const router = useRouter();
  const { setTitle } = useTitle();
  const [tokenView] = useState<ContentView>(initialView);

  useEffect(() => {
    const baseTitle = token?.name ?? `${collection.name} - #${tokenId}`;
    const viewDisplay = tokenView !== ContentView.ABOUT ? tokenView : "";
    const title = viewDisplay ? `${baseTitle} | ${viewDisplay}` : baseTitle;
    setTitle(title);
  }, [tokenView, token?.name, collection.name, tokenId, setTitle]);

  const updateView = (newView?: ContentView) => {
    let newPath = `/nextgen/token/${tokenId}`;
    if (newView && newView !== ContentView.ABOUT) {
      newPath += `/${newView.toLowerCase().replaceAll(" ", "-")}`;
    }
    router.push(newPath, { scroll: false });
  };

  return (
    <main className={styles.main}>
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
