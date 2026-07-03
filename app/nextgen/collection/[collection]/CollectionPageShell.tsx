"use client";

import styles from "@/styles/Home.module.css";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextGenCollectionHead } from "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import type { ReactNode } from "react";
import { useShallowRedirect } from "./useShallowRedirect";

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
      <main className={`${styles["main"]} tailwind-scope`}>
        {withNav && <NextGenNavigationHeader />}
        {children}
      </main>
    </>
  );
}
