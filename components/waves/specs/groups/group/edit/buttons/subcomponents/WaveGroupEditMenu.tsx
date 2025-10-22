"use client";

import { useMemo, useRef } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/common/CompactMenu";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { WaveGroupType } from "../../../WaveGroup";
import WaveGroupEditButton, {
  type WaveGroupEditButtonHandle,
} from "../../WaveGroupEditButton";
import WaveGroupRemoveButton, {
  type WaveGroupRemoveButtonHandle,
} from "../../WaveGroupRemoveButton";

interface WaveGroupEditMenuProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onWaveUpdate: (body: ApiUpdateWaveRequest) => Promise<void>;
  readonly hasGroup: boolean;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly canRemoveGroup: boolean;
  readonly onIncludeIdentity: () => void;
  readonly onExcludeIdentity: () => void;
  readonly onChangeGroup?: () => void;
  readonly onRemoveGroup?: () => void;
}

const MENU_ITEM_CLASS =
  "tw-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out";

export default function WaveGroupEditMenu({
  wave,
  type,
  onWaveUpdate,
  hasGroup,
  canIncludeIdentity,
  canExcludeIdentity,
  canRemoveGroup,
  onIncludeIdentity,
  onExcludeIdentity,
  onChangeGroup,
  onRemoveGroup,
}: WaveGroupEditMenuProps) {
  const editButtonRef = useRef<WaveGroupEditButtonHandle | null>(null);
  const removeButtonRef = useRef<WaveGroupRemoveButtonHandle | null>(null);
  const renderEditTriggerRef = useRef<(() => void) | null>(null);
  const renderRemoveTriggerRef = useRef<(() => void) | null>(null);

  const menuItems = useMemo<CompactMenuItem[]>(() => {
    const items: CompactMenuItem[] = [];
    const changeGroupLabel = hasGroup ? "Change group" : "Add group";

    if (canIncludeIdentity) {
      items.push({
        id: "include",
        label: "Include identity",
        onSelect: onIncludeIdentity,
        className:
          "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
      });
    }

    if (canExcludeIdentity) {
      items.push({
        id: "exclude",
        label: "Exclude identity",
        onSelect: onExcludeIdentity,
        className:
          "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
      });
    }

    items.push({
      id: "change",
      label: changeGroupLabel,
      onSelect: () => {
        if (onChangeGroup) {
          onChangeGroup();
          return;
        }
        if (editButtonRef.current) {
          editButtonRef.current.open();
          return;
        }
        renderEditTriggerRef.current?.();
      },
      className:
        "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
    });

    if (canRemoveGroup) {
      items.push({
        id: "remove",
        label: "Remove group",
        onSelect: () => {
          if (onRemoveGroup) {
            onRemoveGroup();
            return;
          }
          if (removeButtonRef.current) {
            removeButtonRef.current.open();
            return;
          }
          renderRemoveTriggerRef.current?.();
        },
        className:
          "tw-text-red desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-red",
      });
    }

    return items;
  }, [
    canIncludeIdentity,
    canExcludeIdentity,
    onIncludeIdentity,
    onExcludeIdentity,
    onChangeGroup,
    onRemoveGroup,
    canRemoveGroup,
    hasGroup,
  ]);

  return (
    <div className="tw-relative">
      <CompactMenu
        triggerClassName="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        trigger={() => (
          <>
            <span className="tw-sr-only">Group options</span>
            <Cog6ToothIcon className="tw-size-5 tw-flex-shrink-0" />
          </>
        )}
        aria-label="Group options"
        itemsWrapperClassName="tw-flex tw-flex-col"
        unstyledItems
        itemClassName={MENU_ITEM_CLASS}
        focusItemClassName="tw-bg-iron-800 tw-text-iron-50"
        items={menuItems}
      />
      <WaveGroupEditButton
        ref={editButtonRef}
        wave={wave}
        type={type}
        onWaveUpdate={onWaveUpdate}
        renderTrigger={({ open }) => {
          renderEditTriggerRef.current = open;
          return null;
        }}
      />
      {canRemoveGroup ? (
        <WaveGroupRemoveButton
          ref={removeButtonRef}
          wave={wave}
          type={type}
          onWaveUpdate={onWaveUpdate}
          renderTrigger={({ open }) => {
            renderRemoveTriggerRef.current = open;
            return null;
          }}
        />
      ) : null}
    </div>
  );
}
