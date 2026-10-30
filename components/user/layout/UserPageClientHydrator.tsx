"use client";

import { useSetTitle } from "@/contexts/TitleContext";

type Props = {
  readonly pageTitle: string;
};

export default function UserPageClientHydrator({ pageTitle }: Readonly<Props>) {
  // Query data is hydrated by the page's timestamp-aware HydrationBoundary.
  // Titles still belong to individual pages, not the persistent profile layout.
  useSetTitle(pageTitle);

  return null;
}
