"use client";

import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { publicEnv } from "@/config/env";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";


import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsQuickReact from "./WaveDropActionsQuickReact";
import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropMobileMenuBoost from "./WaveDropMobileMenuBoost";
import WaveDropMobileMenuDelete from "./WaveDropMobileMenuDelete";
import WaveDropMobileMenuEdit from "./WaveDropMobileMenuEdit";
import WaveDropMobileMenuOpen from "./WaveDropMobileMenuOpen";

import type { FC } from "react";

interface WaveDropMobileMenuProps {
  readonly drop: ApiDrop;
  readonly isOpen: boolean;
  readonly showReplyAndQuote: boolean;
  readonly longPressTriggered: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly onReply: () => void;
  readonly onAddReaction: () => void;
  readonly onEdit?: (() => void) | undefined;
  readonly onBoostAnimation?: (() => void) | undefined;
  readonly showOpenOption?: boolean | undefined;
  readonly showCopyOption?: boolean | undefined;
}

const WaveDropMobileMenu: FC<WaveDropMobileMenuProps> = ({
  drop,
  isOpen,
  showReplyAndQuote,
  longPressTriggered,
  setOpen,
  onReply,
  onAddReaction,
  onEdit,
  onBoostAnimation,
  showOpenOption = true,
  showCopyOption = true,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isTemporaryDrop = drop.id.startsWith("temp-");

  const extendedDrop = useMemo<ExtendedDrop>(
    () => ({
      ...drop,
      type: DropSize.FULL,
      stableKey: drop.id,
      stableHash: drop.id,
    }),
    [drop]
  );

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (isTemporaryDrop) return;

    const waveDetails = drop.wave as unknown as {
      chat?:
        | {
            scope?:
              | {
                  group?:
                    | { is_direct_message?: boolean | undefined }
                    | undefined;
                }
              | undefined;
          }
        | undefined;
    };
    const isDirectMessage =
      waveDetails.chat?.scope?.group?.is_direct_message ?? false;
    const dropLink = `${publicEnv.BASE_ENDPOINT}${getWaveRoute({
      waveId: drop.wave.id,
      serialNo: drop.serial_no,
      isDirectMessage,
      isApp: false,
    })}`;

    if (typeof navigator.clipboard.writeText === "function") {
      void navigator.clipboard.writeText(dropLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = dropLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    closeMenu();
  };

  const isAuthor = useMemo(
    () =>
      connectedProfile?.handle === drop.author.handle && !activeProfileProxy,
    [connectedProfile, activeProfileProxy, drop.author.handle]
  );

  const showOptions = useMemo(() => {
    if (!connectedProfile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      return false;
    }

    if (drop.id.startsWith("temp-")) {
      return false;
    }

    return connectedProfile.handle === drop.author.handle;
  }, [connectedProfile, activeProfileProxy, drop.id, drop.author.handle]);

  const closeMenu = () => setOpen(false);

  return createPortal(
    <CommonDropdownItemsMobileWrapper isOpen={isOpen} setOpen={setOpen}>
      <div
        className={`tw-grid tw-grid-cols-1 ${
          longPressTriggered && "tw-select-none"
        }`}
      >
        <WaveDropActionsQuickReact
          drop={extendedDrop}
          isMobile
          onReacted={closeMenu}
        />
        <WaveDropActionsAddReaction
          drop={extendedDrop}
          isMobile={true}
          onAddReaction={onAddReaction}
        />
        {showReplyAndQuote && (
          <button
            className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
              isTemporaryDrop
                ? "tw-cursor-default tw-opacity-50"
                : "active:tw-bg-iron-800"
            } tw-transition-colors tw-duration-200`}
            onClick={() => {
              setOpen(false);
              setTimeout(() => onReply(), 250);
            }}
            disabled={isTemporaryDrop}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.49 12L3.74 8.248m0 0l3.75-3.75m-3.75 3.75h16.5V19.5"
              />
            </svg>
            <span className="tw-text-base tw-font-semibold tw-text-iron-300">
              Reply
            </span>
          </button>
        )}

        <WaveDropMobileMenuBoost
          drop={extendedDrop}
          onBoostChange={closeMenu}
          onBoostAnimation={onBoostAnimation}
        />

        {showOpenOption && (
          <WaveDropMobileMenuOpen
            drop={{
              type: DropSize.FULL,
              ...drop,
              stableHash: drop.id,
              stableKey: drop.id,
            }}
            onOpenChange={closeMenu}
          />
        )}

        {showCopyOption && (
          <button
            className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
              isTemporaryDrop
                ? "tw-cursor-default tw-opacity-50"
                : "active:tw-bg-iron-800"
            } tw-transition-colors tw-duration-200`}
            onClick={copyToClipboard}
            disabled={isTemporaryDrop}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
            <span
              className={`tw-text-base tw-font-semibold ${
                copied ? "tw-text-primary-400" : "tw-text-iron-300"
              }`}
            >
              {copied ? "Copied!" : "Copy link"}
            </span>
          </button>
        )}

        <WaveDropActionsMarkUnread
          drop={drop}
          isMobile={true}
          onMarkUnread={closeMenu}
        />
        {!isAuthor && (
          <WaveDropActionsRate
            drop={drop}
            isMobile={true}
            onRated={closeMenu}
          />
        )}
        {showOptions &&
          onEdit &&
          drop.drop_type !== ApiDropType.Participatory && (
            <WaveDropMobileMenuEdit
              drop={drop}
              onEdit={onEdit}
              onEditTriggered={closeMenu}
            />
          )}
        {showOptions && (
          <WaveDropMobileMenuDelete drop={drop} onDropDeleted={closeMenu} />
        )}
      </div>
    </CommonDropdownItemsMobileWrapper>,
    document.body
  );
};

export default WaveDropMobileMenu;
