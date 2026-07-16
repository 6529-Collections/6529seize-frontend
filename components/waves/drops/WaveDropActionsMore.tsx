"use client";

import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { useAuth } from "@/components/auth/Auth";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCanShowDropCurationsAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropActionsCopyText from "./WaveDropActionsCopyText";
import WaveDropCurationsActionIcon from "./WaveDropCurationsActionIcon";
import WaveDropCurationsDialog from "./WaveDropCurationsDialog";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsOpen from "./WaveDropActionsOpen";
import WaveDropActionsOptions from "./WaveDropActionsOptions";
import WaveDropActionsRestoreLinkPreviews from "./WaveDropActionsRestoreLinkPreviews";
import WaveDropActionsSetPinnedDrop from "./WaveDropActionsSetPinnedDrop";

interface WaveDropActionsMoreProps {
  readonly drop: ExtendedDrop;
  readonly onOpenChange?: (isOpen: boolean) => void;
}

export default function WaveDropActionsMore({
  drop,
  onOpenChange,
}: WaveDropActionsMoreProps) {
  const { connectedProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCurationsDialogOpen, setIsCurationsDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { canDelete, canSetPinnedDrop } = useDropInteractionRules(drop);
  const showCurationsAction = useCanShowDropCurationsAction({
    dropId: drop.id,
    isTemporaryDrop: drop.id.startsWith("temp-"),
    isWaveAdmin: drop.wave.authenticated_user_admin === true,
    enabled:
      (isOpen || isCurationsDialogOpen) && Boolean(connectedProfile?.handle),
  });

  const handleOpenChange = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };

  const closeDropdown = () => handleOpenChange(false);

  const handleDeleteClick = () => {
    handleOpenChange(false);
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className="tw-flex tw-h-7 tw-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
        onClick={() => handleOpenChange(!isOpen)}
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-tooltip-id={`more-actions-${drop.id}`}
      >
        <EllipsisHorizontalIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out" />
      </button>
      {!isOpen && (
        <Tooltip
          id={`more-actions-${drop.id}`}
          place="top"
          offset={8}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <span className="tw-text-xs">More</span>
        </Tooltip>
      )}
      <CommonDropdownItemsDefaultWrapper
        isOpen={isOpen}
        setOpen={handleOpenChange}
        buttonRef={buttonRef}
      >
        <li className="tw-list-none">
          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-py-1">
            <WaveDropActionsMarkUnread
              drop={drop}
              isDropdownItem={true}
              onMarkUnread={closeDropdown}
            />
            <WaveDropActionsCopyLink
              drop={drop}
              isDropdownItem={true}
              onCopy={closeDropdown}
            />
            <WaveDropActionsCopyText drop={drop} onCopy={closeDropdown} />
            {showCurationsAction && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeDropdown();
                  setIsCurationsDialogOpen(true);
                }}
                className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
              >
                <WaveDropCurationsActionIcon className="tw-size-4 tw-flex-shrink-0" />
                <span className="tw-text-sm tw-font-medium">Curate</span>
              </button>
            )}
            <WaveDropActionsRestoreLinkPreviews
              drop={drop}
              onRestored={closeDropdown}
            />
            <WaveDropActionsOpen
              drop={drop}
              isDropdownItem={true}
              onOpen={closeDropdown}
            />
            {canSetPinnedDrop && (
              <WaveDropActionsSetPinnedDrop
                drop={drop}
                onPinnedDropSet={closeDropdown}
              />
            )}
            {canDelete && (
              <WaveDropActionsOptions
                drop={drop}
                isDropdownItem={true}
                onDelete={handleDeleteClick}
              />
            )}
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isDeleteModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <DropsListItemDeleteDropModal
              drop={drop}
              closeModal={() => setIsDeleteModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
      {showCurationsAction && (
        <WaveDropCurationsDialog
          dropId={drop.id}
          wave={drop.wave}
          isOpen={isCurationsDialogOpen}
          onClose={() => setIsCurationsDialogOpen(false)}
        />
      )}
    </>
  );
}
