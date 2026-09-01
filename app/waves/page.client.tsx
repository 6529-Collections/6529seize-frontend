"use client";

import WavesLayout from "@/components/waves/layout/WavesLayout";
import WavesView from "@/components/waves/WavesView";

export default function WavesPageClient({
  withLayout = true,
}: {
  readonly withLayout?: boolean;
}) {
  const content = <WavesView />;

  return withLayout ? <WavesLayout>{content}</WavesLayout> : content;
}
