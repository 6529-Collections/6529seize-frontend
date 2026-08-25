"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

const GROUP_OPTIONS_LABEL = waveRightPanelText(
  "waves.sidebar.rightPanel.group.options"
);

interface WaveGroupEditMenuProps {
  readonly hasGroup: boolean;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly canRemoveGroup: boolean;
  readonly onIncludeIdentity: () => void;
  readonly onExcludeIdentity: () => void;
  readonly onChangeGroup: () => void;
  readonly onRemoveGroup: () => void;
}

interface WaveGroupEditMenuTriggerProps {
  readonly label: string;
}

function WaveGroupEditMenuTrigger({ label }: WaveGroupEditMenuTriggerProps) {
  return (
    <>
      <span className="tw-sr-only">{label}</span>
      <Cog6ToothIcon className="tw-size-5 tw-flex-shrink-0" />
    </>
  );
}

export default function WaveGroupEditMenu({
  hasGroup,
  canIncludeIdentity,
  canExcludeIdentity,
  canRemoveGroup,
  onIncludeIdentity,
  onExcludeIdentity,
  onChangeGroup,
  onRemoveGroup,
}: WaveGroupEditMenuProps) {
  const menuItems: CompactMenuItem[] = [];
  const changeGroupLabel = hasGroup
    ? waveRightPanelText("waves.sidebar.rightPanel.group.change")
    : waveRightPanelText("waves.sidebar.rightPanel.group.add");

  if (canIncludeIdentity) {
    menuItems.push({
      id: "include",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.group.includeIdentity"
      ),
      onSelect: onIncludeIdentity,
    });
  }

  if (canExcludeIdentity) {
    menuItems.push({
      id: "exclude",
      label: waveRightPanelText(
        "waves.sidebar.rightPanel.group.excludeIdentity"
      ),
      onSelect: onExcludeIdentity,
    });
  }

  menuItems.push({
    id: "change",
    label: changeGroupLabel,
    onSelect: onChangeGroup,
  });

  if (canRemoveGroup) {
    menuItems.push({
      id: "remove",
      label: waveRightPanelText("waves.sidebar.rightPanel.group.remove"),
      onSelect: onRemoveGroup,
      className: "tw-text-red desktop-hover:hover:tw-text-red",
    });
  }

  return (
    <div className="tw-relative">
      <CompactMenu
        triggerClassName="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out sm:tw-size-7"
        trigger={<WaveGroupEditMenuTrigger label={GROUP_OPTIONS_LABEL} />}
        aria-label={GROUP_OPTIONS_LABEL}
        items={menuItems}
      />
    </div>
  );
}
