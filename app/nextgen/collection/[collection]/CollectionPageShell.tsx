"use client";

import styles from "@/styles/Home.module.scss";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NextGenCollection } from "@/entities/INextgen";
import { NextGenCollectionHead } from "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import { ReactNode } from "react";
import { useShallowRedirect } from "./useShallowRedirect";

export default function CollectionPageShell({
  collection,
  withNav = true,
  children,
}: {
  readonly collection: NextGenCollection;
  readonly withNav?: boolean;
  readonly children: ReactNode;
}) {
  useShallowRedirect(collection.name);

  return (
    <>
      <NextGenCollectionHead collection={collection} />
      <main className={styles.main}>
        {withNav && <NextGenNavigationHeader />}
        {children}
      </main>
    </>
  );
}
