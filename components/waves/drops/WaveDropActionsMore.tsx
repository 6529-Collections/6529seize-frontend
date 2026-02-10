"use client";

import { AuthContext } from "@/components/auth/Auth";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useContext, useMemo, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropActionsDownload from "./WaveDropActionsDownload";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsOpen from "./WaveDropActionsOpen";
import WaveDropActionsOptions from "./WaveDropActionsOptions";
import WaveDropActionsToggleLinkPreview from "./WaveDropActionsToggleLinkPreview";

interface WaveDropActionsMoreProps {
  readonly drop: ExtendedDrop;
  readonly onOpenChange?: (isOpen: boolean) => void;
}

export default function WaveDropActionsMore({
  drop,
  onOpenChange,
}: WaveDropActionsMoreProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { canDelete } = useDropInteractionRules(drop);

  const isAuthor =
    connectedProfile?.handle === drop.author.handle && !activeProfileProxy;

  const handleOpenChange = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };

  const closeDropdown = () => handleOpenChange(false);

  const handleDeleteClick = () => {
    handleOpenChange(false);
    setIsDeleteModalOpen(true);
  };

  const mediaInfo = useMemo(() => {
    const media = drop.parts.at(0)?.media.at(0);
    const url = media?.url;
    if (!url) return null;
    return getFileInfoFromUrl(url);
  }, [drop.parts]);

  return (
    <>
      <button
        ref={buttonRef}
        className="tw-flex tw-h-7 tw-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
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
            <WaveDropActionsOpen
              drop={drop}
              isDropdownItem={true}
              onOpen={closeDropdown}
            />
            {mediaInfo && (
              <WaveDropActionsDownload
                href={drop.parts.at(0)?.media.at(0)?.url ?? ""}
                name={mediaInfo.name}
                extension={mediaInfo.extension}
                tooltipId={`download-media-${drop.id}`}
                isDropdownItem={true}
                onDownload={closeDropdown}
              />
            )}
            {canDelete && (
              <WaveDropActionsOptions
                drop={drop}
                isDropdownItem={true}
                onDelete={handleDeleteClick}
              />
            )}
            {isAuthor && (
              <WaveDropActionsToggleLinkPreview
                drop={drop}
                isDropdownItem={true}
                onToggle={closeDropdown}
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
    </>
  );
}
