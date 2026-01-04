"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { createPortal } from "react-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useEmoji } from "@/contexts/EmojiContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { commonApiPost } from "@/services/api/common-api";
import { useAuth } from "@/components/auth/Auth";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  findReactionIndex,
  cloneReactionEntries,
  removeUserFromReactions,
  toProfileMin,
} from "./reaction-utils";

const WaveDropActionsAddReaction: React.FC<{
  readonly drop: ExtendedDrop;
  readonly isMobile?: boolean | undefined;
  readonly onAddReaction?: (() => void) | undefined;
}> = ({ drop, isMobile = false, onAddReaction }) => {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canReact = drop.type === DropSize.FULL && !isTemporaryDrop;
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null); // Ref for container
  const { emojiMap, categories, categoryIcons } = useEmoji();
  const { setToast, connectedProfile } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const rollbackRef = useRef<(() => void) | null>(null);

  const applyOptimisticReaction = useCallback(
    (reactionCode: string) => {
      if (
        !applyOptimisticDropUpdate ||
        drop.type !== DropSize.FULL ||
        !drop.wave?.id
      ) {
        return null;
      }

      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const userId = profileMin.id;

      const handle = applyOptimisticDropUpdate({
        waveId: drop.wave.id,
        dropId: drop.id,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const reactions = cloneReactionEntries(draft.reactions);
          const reactionsWithoutUser = removeUserFromReactions(
            reactions,
            userId ?? null
          );

          const targetIndex = findReactionIndex(
            reactionsWithoutUser,
            reactionCode
          );

          if (targetIndex >= 0) {
            reactionsWithoutUser[targetIndex] = {
              ...reactionsWithoutUser[targetIndex]!,
              profiles: [
                ...reactionsWithoutUser[targetIndex]?.profiles!,
                profileMin,
              ],
            };
          } else {
            reactionsWithoutUser.push({
              reaction: reactionCode,
              profiles: [profileMin],
            });
          }

          draft.reactions = reactionsWithoutUser;

          const baseContext = draft.context_profile_context ??
            drop.context_profile_context ?? {
              rating: 0,
              min_rating: 0,
              max_rating: 0,
              reaction: null,
            };

          draft.context_profile_context = {
            ...baseContext,
            reaction: reactionCode,
          };

          return draft;
        },
      });

      return handle?.rollback ?? null;
    },
    [
      applyOptimisticDropUpdate,
      connectedProfile,
      drop.context_profile_context,
      drop.id,
      drop.wave?.id,
    ]
  );

  const handleEmojiSelect = async (emoji: {
    native?: string | undefined;
    id?: string | undefined;
  }) => {
    const emojiText = `:${emoji.id}:`;
    setShowPicker(false);

    rollbackRef.current?.();
    rollbackRef.current = applyOptimisticReaction(emojiText);

    try {
      await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/reaction`,
        body: {
          reaction: emojiText,
        },
      });
      rollbackRef.current = null;
      onAddReaction?.();
    } catch (error) {
      let errorMessage = "Error adding reaction";
      if (typeof error === "string") {
        errorMessage = error;
      }
      setToast({
        message: errorMessage,
        type: "error",
      });
      rollbackRef.current?.();
      rollbackRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showPicker &&
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPicker) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPicker]);

  const onReact = () => {
    if (!canReact) return;
    setShowPicker(!showPicker);
  };

  const mobileContent = (
    <button
      className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
        !canReact ? "tw-opacity-50 tw-cursor-default" : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={onReact}
      disabled={!canReact}
    >
      <svg
        className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <g transform="scale(0.024)">
          <path d="M958 104h-62V43q0-17-12-29T855 2h-87q-17 0-29 12t-12 29v61h-62q-17 0-29 12t-12 29v4q-81-34-169-34-116 0-217 59-97 57-154 154-58 100-58 216.5T84 761q57 98 154 155 101 58 217.5 58T672 916q97-57 154-155 59-100 59-216 0-88-34-168h4q17 0 29-12t12-29v-62h62q17 0 29-12t12-29v-88q0-17-12-29t-29-12zM644 348q29 0 49.5 20.5t20.5 49-20.5 49T644 487t-49.5-20.5-20.5-49 20.5-49T644 348zm-377 0q29 0 49.5 20.5t20.5 49-20.5 49T267 487t-49.5-20.5-20.5-49 20.5-49T267 348zm473 255q-10 70-50.5 126.5t-102 88.5-132 32-132-32-102-88.5T171 603q-2-16 8.5-27.5T206 564h499q16 0 26.5 11.5T740 603zm218-370H855v103h-87V233H665v-88h103V43h87v102h103v88z"></path>
        </g>
      </svg>
      <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
        {drop.context_profile_context?.reaction
          ? "Update Reaction"
          : "Add Reaction"}
      </span>
    </button>
  );

  const desktopContent = (
    <>
      <button
        ref={buttonRef}
        className={`picker-button tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 ${
          !canReact ? "tw-opacity-50 tw-cursor-default" : "tw-cursor-pointer"
        } hover:tw-text-[#FFCC22]`}
        onClick={onReact}
        disabled={!canReact}
        aria-label="Add reaction to drop"
        {...(canReact ? { "data-tooltip-id": `add-reaction-${drop.id}` } : {})}
      >
        <svg
          className={`tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 ${
            !canReact ? "tw-opacity-50" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <g transform="scale(0.024)">
            <path d="M958 104h-62V43q0-17-12-29T855 2h-87q-17 0-29 12t-12 29v61h-62q-17 0-29 12t-12 29v4q-81-34-169-34-116 0-217 59-97 57-154 154-58 100-58 216.5T84 761q57 98 154 155 101 58 217.5 58T672 916q97-57 154-155 59-100 59-216 0-88-34-168h4q17 0 29-12t12-29v-62h62q17 0 29-12t12-29v-88q0-17-12-29t-29-12zM644 348q29 0 49.5 20.5t20.5 49-20.5 49T644 487t-49.5-20.5-20.5-49 20.5-49T644 348zm-377 0q29 0 49.5 20.5t20.5 49-20.5 49T267 487t-49.5-20.5-20.5-49 20.5-49T267 348zm473 255q-10 70-50.5 126.5t-102 88.5-132 32-132-32-102-88.5T171 603q-2-16 8.5-27.5T206 564h499q16 0 26.5 11.5T740 603zm218-370H855v103h-87V233H665v-88h103V43h87v102h103v88z"></path>
          </g>
        </svg>
      </button>
      {canReact && (
        <Tooltip
          id={`add-reaction-${drop.id}`}
          place="top"
          positionStrategy="fixed"
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
          <span className="tw-text-xs">
            {drop.context_profile_context?.reaction
              ? "Update Reaction"
              : "Add Reaction"}
          </span>
        </Tooltip>
      )}
    </>
  );

  return (
    <>
      {isMobile ? mobileContent : desktopContent}
      {/* Desktop Picker */}
      {!isMobile &&
        showPicker &&
        createPortal(
          <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-[1000]">
            <div
              ref={pickerContainerRef}
              className="tw-bg-iron-800 tw-p-[1px] tw-rounded-lg tw-shadow-lg"
            >
              <Picker
                theme="dark"
                data={data}
                onEmojiSelect={handleEmojiSelect}
                custom={emojiMap}
                categories={categories}
                categoryIcons={categoryIcons}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Picker */}
      {isMobile && (
        <MobileWrapperDialog
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
        >
          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
            <Picker
              theme="dark"
              data={data}
              onEmojiSelect={handleEmojiSelect}
              custom={emojiMap}
              categories={categories}
              categoryIcons={categoryIcons}
            />
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
};

export default WaveDropActionsAddReaction;
