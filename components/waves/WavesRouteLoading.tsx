"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StreamRouteLoadingShell from "@/components/brain/my-stream/layout/StreamRouteLoadingShell";
import SingleWaveDropLoading from "@/components/waves/drop/SingleWaveDropLoading";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface WavesRouteLoadingProps {
  readonly showSidebar?: boolean;
}

function WavesRouteLoadingContent({
  showSidebar = false,
}: WavesRouteLoadingProps) {
  const searchParams = useSearchParams();
  const locale = useBrowserLocale();
  if (searchParams.get("drop")?.trim()) return <SingleWaveDropLoading />;
  return (
    <StreamRouteLoadingShell
      ariaLabel={t(locale, "waves.loadingStatus")}
      variant="waves"
      showSidebar={showSidebar}
    />
  );
}

export default function WavesRouteLoading(props: WavesRouteLoadingProps) {
  return (
    <Suspense fallback={<SingleWaveDropLoading />}>
      <WavesRouteLoadingContent {...props} />
    </Suspense>
  );
}
