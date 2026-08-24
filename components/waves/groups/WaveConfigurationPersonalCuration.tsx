"use client";

import { useEffect, useId } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import WavePanelSection from "./WavePanelSection";

export default function WaveConfigurationPersonalCuration({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const selectId = useId();
  const pathname = usePathname();
  const router = useRouter();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense -- Wrapped by WaveConfigurationSections Suspense boundary.
  const searchParams = useSearchParams();
  const curationsQuery = useWaveCurations({ waveId: wave.id });
  const curations = curationsQuery.data ?? [];
  const activeCurationId = searchParams.get("curation") ?? "";
  const activeCurationIsAvailable = curations.some(
    (curation) => curation.id === activeCurationId
  );

  useEffect(() => {
    if (
      curationsQuery.isPending ||
      curationsQuery.isError ||
      !activeCurationId ||
      activeCurationIsAvailable
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("curation");
    const query = params.toString();
    // react-doctor-disable-next-line react-doctor/nextjs-no-client-side-redirect -- Reconcile stale viewer-owned URL state after the curation query resolves.
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [
    activeCurationId,
    activeCurationIsAvailable,
    curationsQuery.isError,
    curationsQuery.isPending,
    pathname,
    router,
    searchParams,
  ]);

  if (curationsQuery.isPending || curationsQuery.isError || !curations.length) {
    return null;
  }

  const setSelectedCuration = (curationId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (curationId) {
      params.set("curation", curationId);
    } else {
      params.delete("curation");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <WavePanelSection
      title={waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.personalCuration.title"
      )}
      titleAccessory={
        <TooltipIconButton
          aria-label={waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.personalCuration.tooltipAriaLabel"
          )}
          icon={faInfoCircle}
          tooltipText={waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.personalCuration.tooltip"
          )}
          tooltipPosition="left"
          tooltipWidth="tw-w-64"
        />
      }
    >
      <div className="tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
        <label
          htmlFor={selectId}
          className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500"
        >
          {waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.personalCuration.label"
          )}
        </label>
        <select
          id={selectId}
          value={activeCurationId}
          onChange={(event) => setSelectedCuration(event.target.value)}
          className="tw-form-select tw-min-h-9 tw-w-full tw-min-w-0 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-1.5 tw-pl-3 tw-pr-8 tw-text-sm tw-font-medium tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
        >
          <option value="">
            {waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.personalCuration.default"
            )}
          </option>
          {curations.map((curation) => (
            <option key={curation.id} value={curation.id}>
              {curation.name}
            </option>
          ))}
        </select>
      </div>
    </WavePanelSection>
  );
}
