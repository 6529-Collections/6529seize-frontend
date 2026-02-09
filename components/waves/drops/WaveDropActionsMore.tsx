"use client";

import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useContext, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropActionsDownload from "./WaveDropActionsDownload";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsOpen from "./WaveDropActionsOpen";
import WaveDropActionsOptions from "./WaveDropActionsOptions";
import WaveDropActionsToggleLinkPreview from "./WaveDropActionsToggleLinkPreview";

interface WaveDropActionsMoreProps {
  readonly drop: ExtendedDrop;
}

export default function WaveDropActionsMore({
  drop,
}: WaveDropActionsMoreProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { connectedProfile } = useContext(AuthContext);
  const { canDelete } = useDropInteractionRules(drop);

  const isAuthor = connectedProfile?.handle === drop.author.handle;

  const closeDropdown = () => setIsOpen(false);

  const getMediaInfo = () => {
    const media = drop.parts.at(0)?.media.at(0);
    const url = media?.url;
    if (!url) return null;
    return getFileInfoFromUrl(url);
  };

  const mediaInfo = getMediaInfo();

  return (
    <>
      <button
        ref={buttonRef}
        className="icon tw-group tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-[0.8125rem] tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300"
        onClick={() => setIsOpen(!isOpen)}
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
        setOpen={setIsOpen}
        buttonRef={buttonRef}
      >
        <li className="tw-list-none">
          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-py-1">
            <WaveDropActionsMarkUnread
              drop={drop}
              isDropdownItem={true}
              onMarkUnread={closeDropdown}
            />
            <WaveDropActionsCopyLink drop={drop} isDropdownItem={true} onCopy={closeDropdown} />
            <WaveDropActionsOpen drop={drop} isDropdownItem={true} />
            {mediaInfo && (
              <WaveDropActionsDownload
                href={drop.parts.at(0)?.media.at(0)?.url ?? ""}
                name={mediaInfo.name}
                extension={mediaInfo.extension}
                tooltipId={`download-media-${drop.id}`}
                isDropdownItem={true}
              />
            )}
            {canDelete && (
              <WaveDropActionsOptions
                drop={drop}
                isDropdownItem={true}
                onDelete={closeDropdown}
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
    </>
  );
}
