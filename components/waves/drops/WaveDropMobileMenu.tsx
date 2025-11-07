"use client";

import { publicEnv } from "@/config/env";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { FC, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropMobileMenuDelete from "./WaveDropMobileMenuDelete";
import WaveDropMobileMenuEdit from "./WaveDropMobileMenuEdit";
import WaveDropMobileMenuFollow from "./WaveDropMobileMenuFollow";
import WaveDropMobileMenuOpen from "./WaveDropMobileMenuOpen";

interface WaveDropMobileMenuProps {
  readonly drop: ApiDrop;
  readonly isOpen: boolean;
  readonly showReplyAndQuote: boolean;
  readonly longPressTriggered: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly onReply: () => void;
  readonly onQuote: () => void;
  readonly onAddReaction: () => void;
  readonly onEdit?: () => void;
  readonly showOpenOption?: boolean;
  readonly showCopyOption?: boolean;
  readonly showFollowOption?: boolean;
}

const WaveDropMobileMenu: FC<WaveDropMobileMenuProps> = ({
  drop,
  isOpen,
  showReplyAndQuote,
  longPressTriggered,
  setOpen,
  onReply,
  onQuote,
  onAddReaction,
  onEdit,
  showOpenOption = true,
  showCopyOption = true,
  showFollowOption = true,
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
    if (longPressTriggered) return;
    if (isTemporaryDrop) return;

    const waveDetails =
      (drop.wave as unknown as {
        chat?: { scope?: { group?: { is_direct_message?: boolean } } };
      }) ?? undefined;
    const isDirectMessage =
      waveDetails?.chat?.scope?.group?.is_direct_message ?? false;
    const dropLink = `${publicEnv.BASE_ENDPOINT}${getWaveRoute({
      waveId: drop.wave.id,
      serialNo: drop.serial_no,
      isDirectMessage,
      isApp: false,
    })}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(dropLink).then(() => {
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
  };

  const getIsAuthor = () =>
    connectedProfile?.handle === drop.author.handle && !activeProfileProxy;
  const [isAuthor, setIsAuthor] = useState(getIsAuthor());
  useEffect(() => setIsAuthor(getIsAuthor()), [connectedProfile]);

  const getShowOptions = () => {
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
  };

  const [showOptions, setShowOptions] = useState(getShowOptions());
  useEffect(
    () => setShowOptions(getShowOptions()),
    [connectedProfile, activeProfileProxy]
  );

  const closeMenu = () => setOpen(false);

  return createPortal(
    <CommonDropdownItemsMobileWrapper isOpen={isOpen} setOpen={setOpen}>
      <div
        className={`tw-grid tw-grid-cols-1 tw-gap-y-2 ${
          longPressTriggered && "tw-select-none"
        }`}>
        <WaveDropActionsAddReaction
          drop={extendedDrop}
          isMobile={true}
          onAddReaction={onAddReaction}
        />
        {showReplyAndQuote && (
          <>
            <button
              className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
                isTemporaryDrop
                  ? "tw-opacity-50 tw-cursor-default"
                  : "active:tw-bg-iron-800"
              } tw-transition-colors tw-duration-200`}
              onClick={() => {
                setOpen(false);
                setTimeout(() => onReply(), 250);
              }}
              disabled={isTemporaryDrop}>
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.49 12L3.74 8.248m0 0l3.75-3.75m-3.75 3.75h16.5V19.5"
                />
              </svg>
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Reply
              </span>
            </button>
            <button
              className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
                isTemporaryDrop
                  ? "tw-opacity-50 tw-cursor-default"
                  : "active:tw-bg-iron-800"
              } tw-transition-colors tw-duration-200`}
              onClick={() => {
                setOpen(false);
                setTimeout(() => onQuote(), 250);
              }}
              disabled={isTemporaryDrop}>
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.9486 14.4306C4.45605 15.6736 3.67749 16.904 2.63489 18.0883C2.3031 18.4652 2.26098 19.0031 2.53015 19.4268C2.73742 19.7528 3.08606 19.9384 3.4552 19.9384C3.5592 19.9384 3.66504 19.9238 3.76941 19.8934C5.97913 19.2478 11.1335 16.9546 11.272 9.62448C11.3254 6.79404 9.25526 4.3624 6.55958 4.08847C5.07385 3.93978 3.5874 4.42245 2.48584 5.41818C1.38281 6.41501 0.75 7.8381 0.75 9.32309C0.75 11.8005 2.50854 13.967 4.9486 14.4306ZM3.49145 6.53109C4.19201 5.89791 5.07385 5.56063 6.00879 5.56063C6.14099 5.56063 6.27429 5.56722 6.40796 5.58114C8.33313 5.77632 9.8108 7.54 9.77198 9.59591C9.6764 14.6679 6.93018 16.9513 4.65601 17.9726C5.37561 16.9992 5.94104 15.998 6.34314 14.9832C6.49988 14.5881 6.47388 14.1465 6.27209 13.7715C6.06079 13.3781 5.68396 13.0991 5.23901 13.0057C3.50683 12.6435 2.25 11.0944 2.25 9.32308C2.25 8.26181 2.70263 7.24411 3.49145 6.53109Z"
                  fill="currentColor"
                />
                <path
                  d="M14.508 19.4271C14.7153 19.753 15.064 19.9387 15.4331 19.9387C15.5371 19.9387 15.6426 19.924 15.7473 19.8936C17.957 19.248 23.1111 16.9548 23.2495 9.62472C23.3022 6.79427 21.2324 4.36263 18.5364 4.08871C17.0488 3.93746 15.5649 4.42232 14.4634 5.41842C13.3604 6.41525 12.7275 7.83834 12.7275 9.32333C12.7275 11.8007 14.4861 13.9672 16.9258 14.4309C16.4329 15.6749 15.6543 16.9054 14.6121 18.089C14.2803 18.4661 14.2385 19.0037 14.508 19.4271ZM18.3203 14.9842C18.477 14.5891 18.4514 14.1474 18.25 13.7724C18.0383 13.3787 17.6618 13.0997 17.2165 13.0059C15.4844 12.6438 14.2275 11.0947 14.2275 9.32333C14.2275 8.26168 14.6802 7.24435 15.469 6.53133C16.1692 5.89815 17.051 5.56087 17.9863 5.56087C18.1181 5.56087 18.2515 5.56746 18.3855 5.58137C20.3103 5.77656 21.7883 7.54024 21.7495 9.59615C21.6543 14.6685 18.9077 16.9515 16.6335 17.9729C17.3528 17.0002 17.9175 15.999 18.3203 14.9842Z"
                  fill="currentColor"
                />
              </svg>
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Quote
              </span>
            </button>
          </>
        )}

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
            className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
              isTemporaryDrop
                ? "tw-opacity-50 tw-cursor-default"
                : "active:tw-bg-iron-800"
            } tw-transition-colors tw-duration-200`}
            onClick={copyToClipboard}
            disabled={isTemporaryDrop}>
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
            <span
              className={`tw-font-semibold tw-text-base ${
                copied ? "tw-text-primary-400" : "tw-text-iron-300"
              }`}>
              {copied ? "Copied!" : "Copy link"}
            </span>
          </button>
        )}

        {showFollowOption && !isAuthor && (
          <WaveDropMobileMenuFollow drop={drop} onFollowChange={closeMenu} />
        )}
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
