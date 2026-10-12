"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  RectangleStackIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import { useAuth } from "@/components/auth/Auth";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useCompetitionHub } from "@/hooks/competitions/useCompetitionQueries";
import {
  getCompetitionRoute,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { t } from "@/i18n/messages";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCreateActionsMenuProps {
  readonly wave: ApiWave;
  readonly onCreated: (curationId: string) => void;
  readonly variant?: "desktop" | "mobile" | undefined;
}

export default function MyStreamWaveCreateActionsMenu({
  wave,
  onCreated,
  variant = "desktop",
}: MyStreamWaveCreateActionsMenuProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const router = useRouter();
  const locale = useBrowserLocale();
  const isMobileViewport = useIsMobileLayoutViewport();
  const isMobile = variant === "mobile" || isMobileViewport;
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const [isCreateSubwaveOpen, setIsCreateSubwaveOpen] = useState(false);
  const isDirectMessage = wave.chat?.scope?.group?.is_direct_message ?? false;
  const competitionsEnabled = isMultiCompetitionEnabled() && !isDirectMessage;
  const hub = useCompetitionHub(wave.id, competitionsEnabled);
  const canCreateCompetition =
    competitionsEnabled && hub.data?.permissions.create_competition === true;
  const waveConfig = wave.wave as typeof wave.wave | null | undefined;
  const parentAdminGroup = waveConfig?.admin_group as
    | typeof wave.wave.admin_group
    | null
    | undefined;
  const parentAdminGroupId = parentAdminGroup?.group?.id ?? null;
  const canCreateCuration =
    waveConfig?.authenticated_user_eligible_for_admin === true;
  const canCreateSubwave =
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    !isDirectMessage &&
    !wave.parent_wave &&
    Boolean(parentAdminGroupId) &&
    waveConfig?.authenticated_user_eligible_for_admin === true;

  const actionLabel = (label: string, description: string) => (
    <span className="tw-flex tw-flex-col tw-gap-0.5">
      <span className="tw-font-semibold tw-text-iron-100">{label}</span>
      <span className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
        {description}
      </span>
    </span>
  );
  const menuItems: CompactMenuItem[] = [
    ...(canCreateCompetition
      ? [
          {
            id: "create-competition",
            icon: <TrophyIcon className="tw-size-5" aria-hidden="true" />,
            label: actionLabel(
              t(locale, "competitions.new"),
              t(locale, "waves.create.actions.competitionDescription")
            ),
            onSelect: () => router.push(getCompetitionRoute(wave.id, "new")),
          },
        ]
      : []),
    ...(canCreateCuration
      ? [
          {
            id: "create-curation",
            icon: (
              <RectangleStackIcon className="tw-size-5" aria-hidden="true" />
            ),
            label: actionLabel(
              t(locale, "waves.create.actions.newCuration"),
              t(locale, "waves.create.actions.curationDescription")
            ),
            onSelect: () => setIsCreateCurationOpen(true),
          },
        ]
      : []),
    ...(canCreateSubwave
      ? [
          {
            id: "create-subwave",
            icon: (
              <ChatBubbleLeftRightIcon
                className="tw-size-5"
                aria-hidden="true"
              />
            ),
            label: actionLabel(
              t(locale, "waves.create.actions.newSubwave"),
              t(locale, "waves.create.actions.subwaveDescription")
            ),
            onSelect: () => setIsCreateSubwaveOpen(true),
          },
        ]
      : []),
  ];

  if (menuItems.length === 0) {
    return null;
  }

  const buttonClassName =
    "tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 motion-reduce:tw-transition-none";
  const trigger = (
    <>
      <PlusIcon className="tw-size-4 tw-shrink-0" aria-hidden="true" />
      <span>{t(locale, "waves.create.actions.create")}</span>
    </>
  );

  return (
    <>
      <span className="tw-inline-flex tw-shrink-0 tw-self-center">
        {isMobile ? (
          <CompactMenuMobileBottomSheet
            title={t(locale, "waves.create.actions.createMenuHeader")}
            ariaLabel={t(locale, "waves.create.actions.openCreateMenu")}
            trigger={trigger}
            triggerClassName={buttonClassName}
            items={menuItems}
          />
        ) : (
          <CompactMenu
            className="tailwind-scope tw-flex tw-flex-shrink-0"
            trigger={trigger}
            triggerClassName={buttonClassName}
            unstyledTrigger
            aria-label={t(locale, "waves.create.actions.openCreateMenu")}
            items={menuItems}
            menuWidthClassName="tw-w-80"
            unstyledMenu
            menuClassName="tailwind-scope tw-z-50 tw-mt-2 tw-rounded-xl tw-bg-iron-950 tw-py-0 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none"
            header={t(locale, "waves.create.actions.createMenuHeader")}
            headerClassName="tw-px-5 tw-pb-1 tw-pt-4 tw-text-sm tw-font-semibold tw-text-iron-100"
            itemsWrapperClassName="tw-p-2"
            itemClassName="tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-3 tw-text-left tw-text-sm tw-leading-6 tw-transition-colors motion-reduce:tw-transition-none"
            inactiveItemClassName="tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800/70 desktop-hover:hover:tw-text-white"
            focusItemClassName="tw-bg-iron-800/70 tw-text-white"
            unstyledItems
          />
        )}
      </span>

      {isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => onCreated(curation.id)}
        />
      )}

      {connectedProfile && canCreateSubwave && (
        <CreateWaveModal
          isOpen={isCreateSubwaveOpen}
          onClose={() => setIsCreateSubwaveOpen(false)}
          profile={connectedProfile}
          parentWaveId={wave.id}
          parentWaveName={wave.name}
          parentAdminGroupId={parentAdminGroupId}
          parentViewGroupId={wave.visibility.scope.group?.id ?? null}
        />
      )}
    </>
  );
}
