"use client";

import type { ReactNode } from "react";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { CancelledError, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CompactMenuItem } from "@/components/compact-menu";
import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";
import MyStreamWaveCurationTabMenu from "@/components/brain/my-stream/tabs/MyStreamWaveCurationTabMenu";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import WaveGroupMembersScope from "@/components/waves/specs/groups/group/WaveGroupMembersScope";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import {
  PENDING_PROFILE_QUERY_VIEWER,
  useProfileQueryViewer,
} from "@/hooks/useProfileQueryViewer";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { commonApiFetch } from "@/services/api/common-api";
import { getCurrentProfileQueryViewer } from "@/services/auth/profile-query-viewer";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationCurationRowProps {
  readonly curation: ApiWaveCuration;
  readonly curations: readonly ApiWaveCuration[];
  readonly index: number;
  readonly isMovePending: boolean;
  readonly onDeleted: () => void;
  readonly onMove: (direction: "previous" | "next") => void;
  readonly viewer: string | null;
  readonly wave: ApiWave;
}

function WaveConfigurationCurationRow({
  curation,
  curations,
  index,
  isMovePending,
  onDeleted,
  onMove,
  viewer,
  wave,
}: WaveConfigurationCurationRowProps) {
  // A wave editor only sees private criteria returned for their own session.
  const groupQuery = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, curation.group_id, viewer],
    queryFn: async ({ signal }) => {
      if (getCurrentProfileQueryViewer() !== viewer) {
        throw new CancelledError({ revert: true });
      }
      return await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(curation.group_id)}`,
        signal,
        cache: "no-store",
      });
    },
    enabled: viewer !== null && viewer !== PENDING_PROFILE_QUERY_VIEWER,
    staleTime: 5 * 60 * 1000,
  });
  const leadingItems: CompactMenuItem[] = [
    {
      id: "move-up",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.moveUp"
      ),
      icon: <ArrowUpIcon aria-hidden="true" className="tw-size-4" />,
      disabled: index === 0 || isMovePending,
      onSelect: () => onMove("previous"),
    },
    {
      id: "move-down",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.curations.moveDown"
      ),
      icon: <ArrowDownIcon aria-hidden="true" className="tw-size-4" />,
      disabled: index === curations.length - 1 || isMovePending,
      onSelect: () => onMove("next"),
    },
  ];
  const group = groupQuery.isError ? undefined : groupQuery.data;

  return (
    <div className="tw-relative tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_2.75rem] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-2 tw-py-1.5 tw-text-sm sm:tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_1.75rem] [&_a]:tw-relative [&_a]:tw-z-10">
      <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-font-normal tw-leading-5 tw-text-iron-500">
        {curation.name}
      </span>
      <div className="tw-flex tw-min-w-0 tw-justify-end tw-text-right">
        {group ? (
          <WaveGroupMembersScope
            group={{ id: group.id, name: group.name, is_hidden: false }}
            groupDetails={group}
          />
        ) : (
          <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-font-medium tw-leading-5 tw-text-iron-50">
            {waveRightPanelText(
              groupQuery.isPending
                ? "waves.sidebar.rightPanel.configuration.curations.loadingGroup"
                : "waves.sidebar.rightPanel.configuration.curations.unavailableGroup"
            )}
          </span>
        )}
      </div>
      <MyStreamWaveCurationTabMenu
        wave={wave}
        curation={curation}
        onDeleted={onDeleted}
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

function WaveConfigurationCurationsAuthorizedContent({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense -- Wrapped by WaveConfigurationAdminSettings Suspense boundary.
  const searchParams = useSearchParams();
  const locale = useBrowserLocale();
  const viewer = useProfileQueryViewer();
  const createPanel = useWaveInformationPanel(
    t(locale, "profileCuration.editor.createTitle"),
    undefined,
    "modal"
  );
  const curationsQuery = useWaveCurations({ waveId: wave.id });
  const curations = curationsQuery.data ?? [];
  const { moveCuration, isPending } = useWaveCurationReorderMutation({
    waveId: wave.id,
  });

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
      <p className="tw-mb-0 tw-px-2 tw-py-1.5 tw-text-sm tw-font-normal tw-italic tw-text-iron-500">
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
            isMovePending={isPending}
            onDeleted={() => clearDeletedSelection(curation.id)}
            onMove={(direction) =>
              moveCuration({ curation, direction, curations })
            }
            viewer={viewer}
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
            onClick={(event) => createPanel.open(event.currentTarget)}
            className="tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 sm:tw-size-7"
          >
            <PlusIcon aria-hidden="true" className="tw-size-5" />
          </button>
        }
      >
        {content}
      </WavePanelSection>

      {createPanel.isOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen
          onClose={createPanel.close}
          panelContainer={
            createPanel.isInSheet ? createPanel.container : undefined
          }
          onSaved={() => undefined}
        />
      )}
    </>
  );
}

export default function WaveConfigurationCurations({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const canConfigureWave = canEditWave({
    connectedProfile,
    activeProfileProxy,
    wave,
  });

  if (!canConfigureWave) {
    return null;
  }

  // Keep the authorization hook in this wrapper and the curation data hooks in
  // the authorized child so hook order is stable and unauthorized viewers do
  // not start curation queries or mutations.
  return <WaveConfigurationCurationsAuthorizedContent wave={wave} />;
}
