"use client";

import WavesView from "@/components/waves/WavesView";

export default function CompetitionRoute() {
  // Tab navigation can retain this entry page while the wave list changes the
  // selection. Use the same live selection and empty state as the wave entry.
  return <WavesView />;
}
