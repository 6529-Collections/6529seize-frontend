"use client";

import { useState } from "react";
import {
  InformationCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import CompactWaveActions, {
  COMPACT_WAVE_ACTION_CLASSES,
} from "@/components/brain/my-stream/tabs/CompactWaveActions";
import MainStageNominationPopover, {
  MainStageNominationPopoverContent,
} from "@/components/brain/my-stream/tabs/MainStageNominationPopover";
import { useWaveCreateMenuActions } from "@/components/brain/my-stream/tabs/MyStreamWaveCreateActionsMenu";
import type { CompactMenuItem } from "@/components/compact-menu";
import { useDisplayTimeZoneMenuItem } from "@/components/display-time-zone/DisplayTimeZoneSwitch";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";
import WaveHeaderRestrictionButton, {
  WAVE_HEADER_RESTRICTION_SURFACE_CLASS,
} from "@/components/waves/header/WaveHeaderRestrictionButton";
import type {
  HeaderWaveCreateNavigation,
  HeaderWaveDropAction,
} from "@/contexts/HeaderContext";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import HeaderSearchButton from "./header-search/HeaderSearchButton";

const HEADER_RESTRICTION_BUTTON_CLASS = `${COMPACT_ACTION_TOUCH_TARGET_CLASS} ${WAVE_HEADER_RESTRICTION_SURFACE_CLASS} tw-size-9 tw-min-w-9`;

/** Keep an unavailable drop action interactive so its restriction is readable. */
export const HeaderDropActionButton = ({
  action,
  inMenu = false,
}: {
  readonly action: HeaderWaveDropAction | null;
  readonly inMenu?: boolean | undefined;
}) => {
  if (!action) {
    return null;
  }

  if (action.canOpen) {
    return (
      <Button
        onClick={action.onOpen}
        size={null}
        title={action.restrictionMessage ?? action.label}
        aria-label={action.label}
        className="tw-size-9 tw-min-w-9 tw-p-0"
      >
        <PlusIcon className="tw-size-5 tw-flex-shrink-0" />
        <span className="tw-sr-only">{action.compactLabel}</span>
      </Button>
    );
  }

  if (action.restrictionKind === "memes-nomination") {
    return (
      <MainStageNominationPopover>
        <button
          type="button"
          aria-label={action.label}
          aria-haspopup="dialog"
          className={`tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-size-9 tw-min-w-9 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 desktop-hover:hover:tw-text-white`}
        >
          <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
          <span className="tw-sr-only">{action.compactLabel}</span>
        </button>
      </MainStageNominationPopover>
    );
  }

  const buttonClass = inMenu
    ? `${COMPACT_WAVE_ACTION_CLASSES} !tw-justify-start tw-text-iron-300`
    : HEADER_RESTRICTION_BUTTON_CLASS;

  return (
    <WaveHeaderRestrictionButton
      label={action.label}
      reason={action.restrictionMessage ?? action.label}
      accessWave={action.accessWave}
      onViewRules={action.onViewRules}
      className={buttonClass}
    >
      <LockClosedIcon className="tw-size-4 tw-flex-shrink-0" />
      {inMenu ? (
        <span>{action.label}</span>
      ) : (
        <span className="tw-sr-only">{action.compactLabel}</span>
      )}
    </WaveHeaderRestrictionButton>
  );
};

export default function PhoneWaveHeaderActions({
  wave,
  dropAction,
  items,
  createNavigation,
}: {
  readonly wave: ApiWave;
  readonly dropAction: HeaderWaveDropAction | null;
  readonly items: readonly CompactMenuItem[];
  readonly createNavigation: HeaderWaveCreateNavigation | null;
}) {
  const information = useWaveInformation();
  const locale = useBrowserLocale();
  const timeZone = useDisplayTimeZoneMenuItem();
  const [isSubmissionHelpOpen, setIsSubmissionHelpOpen] = useState(false);
  const { items: createItems, dialogs } = useWaveCreateMenuActions({
    wave: createNavigation?.waveId === wave.id ? wave : undefined,
    mobile: true,
    onCreated: (id) => createNavigation?.onCreated(id),
  });
  const waveDetails: CompactMenuItem = {
    id: "wave-details",
    label: waveRightPanelText("waves.sidebar.rightPanel.controls.openDetails"),
    icon: <InformationCircleIcon className="tw-size-4" aria-hidden="true" />,
    onSelect: () => information?.open(wave.id),
    deferUntilClosed: true,
  };
  const isNominationHelp = dropAction?.restrictionKind === "memes-nomination";
  const submitActions: CompactMenuItem[] =
    dropAction && (dropAction.canOpen || isNominationHelp)
      ? [
          {
            id: "submit-work",
            label: dropAction.label,
            icon: isNominationHelp ? (
              <LockClosedIcon className="tw-size-4" aria-hidden="true" />
            ) : (
              <PlusIcon className="tw-size-4" aria-hidden="true" />
            ),
            onSelect: isNominationHelp
              ? () => setIsSubmissionHelpOpen(true)
              : dropAction.onOpen,
            deferUntilClosed: true,
          },
        ]
      : [];

  return (
    <>
      <HeaderSearchButton
        wave={wave}
        renderTrigger={({ open }) => (
          <CompactWaveActions
            phone
            items={[
              waveDetails,
              {
                id: "search-messages",
                label: t(locale, "waves.drops.searchModal.title"),
                icon: (
                  <MagnifyingGlassIcon
                    className="tw-size-4"
                    aria-hidden="true"
                  />
                ),
                onSelect: open,
                deferUntilClosed: true,
              },
              ...submitActions,
              timeZone,
              ...items,
              ...createItems,
            ]}
            renderAdditionalControls={
              dropAction && !dropAction.canOpen && !isNominationHelp
                ? () => <HeaderDropActionButton action={dropAction} inMenu />
                : undefined
            }
          />
        )}
      />
      {dialogs}
      {isSubmissionHelpOpen && (
        <MobileWrapperDialog
          isOpen
          onClose={() => setIsSubmissionHelpOpen(false)}
          title={dropAction?.label ?? "How to Submit"}
          ariaLabel="Main Stage submission eligibility"
          headerVariant="minimal"
        >
          <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
            <MainStageNominationPopoverContent className="tw-w-full" />
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
}
