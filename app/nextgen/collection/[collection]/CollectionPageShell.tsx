"use client";

import { NextGenCollectionHead } from "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import type { NextGenCollection } from "@/entities/INextgen";
import styles from "@/styles/Home.module.scss";

import { useShallowRedirect } from "./useShallowRedirect";

import type { ReactNode } from "react";

export default function CollectionPageShell({
  collection,
  withNav = true,
  children,
}: {
  readonly collection: NextGenCollection;
  readonly withNav?: boolean | undefined;
  readonly children: ReactNode;
}) {
  useShallowRedirect(collection.name);

  return (
    <>
      <NextGenCollectionHead collection={collection} />
      <main className={styles["main"]}>
        {withNav && <NextGenNavigationHeader />}
        {children}
      </main>
    </>
  );
}
