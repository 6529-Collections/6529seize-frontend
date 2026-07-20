"use client";

import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { NEXTGEN_PAGE_FRAME_CLASSNAME } from "@/components/nextGen/collections/NextGenPageFrame";
import type { NextGenCollection } from "@/entities/INextgen";
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
    <main className={NEXTGEN_PAGE_FRAME_CLASSNAME}>
      {withNav && <NextGenNavigationHeader />}
      {children}
    </main>
  );
}
