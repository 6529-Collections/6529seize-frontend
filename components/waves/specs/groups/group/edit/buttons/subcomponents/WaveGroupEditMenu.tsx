"use client";

import { useMemo } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/common/CompactMenu";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { WaveGroupType } from "../../../WaveGroup";
import WaveGroupEditButton from "../../WaveGroupEditButton";
import WaveGroupRemoveButton from "../../WaveGroupRemoveButton";

interface WaveGroupEditMenuProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onEdit: (body: ApiUpdateWaveRequest) => Promise<void>;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly shouldAllowRemove: boolean;
  readonly onIncludeIdentity: () => void;
  readonly onExcludeIdentity: () => void;
  readonly onChangeGroup: () => void;
  readonly onRemoveGroup: () => void;
  readonly registerEditTrigger: (open: () => void) => void;
  readonly registerRemoveTrigger: (open: () => void) => void;
}

const MENU_ITEM_CLASS =
  "tw-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out";

export default function WaveGroupEditMenu({
  wave,
  type,
  onEdit,
  canIncludeIdentity,
  canExcludeIdentity,
  shouldAllowRemove,
  onIncludeIdentity,
  onExcludeIdentity,
  onChangeGroup,
  onRemoveGroup,
  registerEditTrigger,
  registerRemoveTrigger,
}: WaveGroupEditMenuProps) {
  const menuItems = useMemo<CompactMenuItem[]>(() => {
    const items: CompactMenuItem[] = [];

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
      label: "Change group",
      onSelect: onChangeGroup,
      className:
        "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
    });

    if (shouldAllowRemove) {
      items.push({
        id: "remove",
        label: "Remove group",
        onSelect: onRemoveGroup,
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
    shouldAllowRemove,
  ]);

  return (
    <div className="tw-relative">
      <div className="tw-hidden">
        <WaveGroupEditButton
          wave={wave}
          type={type}
          onEdit={onEdit}
          renderTrigger={({ open }) => {
            registerEditTrigger(open);
            return null;
          }}
        />
        {shouldAllowRemove ? (
          <WaveGroupRemoveButton
            wave={wave}
            type={type}
            onEdit={onEdit}
            renderTrigger={({ open }) => {
              registerRemoveTrigger(open);
              return null;
            }}
          />
        ) : null}
      </div>
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
    </div>
  );
}
