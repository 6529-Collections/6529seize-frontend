"use client";

import { useSearchParams } from "next/navigation";
import StreamRouteLoadingShell from "@/components/brain/my-stream/layout/StreamRouteLoadingShell";
import SingleWaveDropLoading from "@/components/waves/drop/SingleWaveDropLoading";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WavesRouteLoading({
  showSidebar = false,
}: {
  readonly showSidebar?: boolean;
}) {
  const searchParams = useSearchParams();
  const locale = useBrowserLocale();
  if (searchParams.get("drop")?.trim()) return <SingleWaveDropLoading />;
  return (
    <StreamRouteLoadingShell
      ariaLabel={t(locale, "navigation.primary.loading.waves")}
      variant="waves"
      showSidebar={showSidebar}
    />
  );
}
