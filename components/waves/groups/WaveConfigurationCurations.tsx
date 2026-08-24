"use client";

import { type ReactNode, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CompactMenuItem } from "@/components/compact-menu";
import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";
import MyStreamWaveCurationTabMenu from "@/components/brain/my-stream/tabs/MyStreamWaveCurationTabMenu";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { commonApiFetch } from "@/services/api/common-api";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationCurationRowProps {
  readonly curation: ApiWaveCuration;
  readonly curations: readonly ApiWaveCuration[];
  readonly index: number;
  readonly isReordering: boolean;
  readonly onDeleted: () => void;
  readonly onMove: (direction: "previous" | "next") => void;
  readonly wave: ApiWave;
}

function WaveConfigurationCurationRow({
  curation,
  curations,
  index,
  isReordering,
  onDeleted,
  onMove,
  wave,
}: WaveConfigurationCurationRowProps) {
  const groupQuery = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, curation.group_id],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${curation.group_id}`,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const leadingItems: CompactMenuItem[] = [
    {
      id: "move-up",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.moveUp"
      ),
      icon: <ArrowUpIcon aria-hidden="true" className="tw-size-4" />,
      disabled: index === 0 || isReordering,
      onSelect: () => onMove("previous"),
    },
    {
      id: "move-down",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.moveDown"
      ),
      icon: <ArrowDownIcon aria-hidden="true" className="tw-size-4" />,
      disabled: index === curations.length - 1 || isReordering,
      onSelect: () => onMove("next"),
    },
  ];
  const groupLabel = groupQuery.isPending
    ? waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.loadingGroup"
      )
    : (groupQuery.data?.name ??
      waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.unavailableGroup"
      ));

  return (
    <div className="tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_2.75rem] tw-items-start tw-gap-x-2 tw-gap-y-1 tw-px-2 tw-py-1.5 tw-text-sm sm:tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_1.75rem]">
      <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-font-normal tw-leading-5 tw-text-iron-500">
        {curation.name}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
        {groupLabel}
      </span>
      <MyStreamWaveCurationTabMenu
        wave={wave}
        curation={curation}
        onDeleted={onDeleted}
        isSetAsProfileCurationPending={isReordering}
        leadingItems={leadingItems}
        triggerAriaLabel={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.curations.configure",
          { curation: curation.name }
        )}
        triggerVariant="configuration"
      />
    </div>
  );
}

export default function WaveConfigurationCurations({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const curationsQuery = useWaveCurations({ waveId: wave.id });
  const curations = curationsQuery.data ?? [];
  const { moveCuration, isPending, pendingCurationId } =
    useWaveCurationReorderMutation({ waveId: wave.id });

  const clearDeletedSelection = (curationId: string) => {
    if (searchParams.get("curation") !== curationId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("curation");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  let content: ReactNode;
  if (curationsQuery.isPending) {
    content = (
      <p className="tw-mb-0 tw-px-2 tw-py-1.5 tw-text-sm tw-text-iron-500">
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.curations.loading"
        )}
      </p>
    );
  } else if (curationsQuery.isError) {
    content = (
      <p
        role="alert"
        className="tw-mb-0 tw-px-2 tw-py-1.5 tw-text-sm tw-text-error"
      >
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.curations.error"
        )}
      </p>
    );
  } else if (curations.length === 0) {
    content = (
      <p className="tw-mb-0 tw-px-2 tw-py-1.5 tw-text-sm tw-font-light tw-italic tw-text-iron-500">
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.curations.empty"
        )}
      </p>
    );
  } else {
    content = (
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
        {curations.map((curation, index) => (
          <WaveConfigurationCurationRow
            key={curation.id}
            curation={curation}
            curations={curations}
            index={index}
            isReordering={isPending && pendingCurationId === curation.id}
            onDeleted={() => clearDeletedSelection(curation.id)}
            onMove={(direction) =>
              moveCuration({ curation, direction, curations })
            }
            wave={wave}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <WavePanelSection
        title={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.curations.title"
        )}
        titleAccessory={
          <button
            type="button"
            aria-label={waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.curations.create"
            )}
            title={waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.curations.create"
            )}
            onClick={() => setIsCreateOpen(true)}
            className="tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 sm:tw-size-7"
          >
            <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
          </button>
        }
      >
        {content}
      </WavePanelSection>

      {isCreateOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSaved={() => undefined}
        />
      )}
    </>
  );
}
