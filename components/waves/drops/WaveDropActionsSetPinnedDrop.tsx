"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useSetWavePinnedDrop } from "@/hooks/waves/useSetWavePinnedDrop";
import { canReplyFromSession } from "@/helpers/waves/drop-reply-eligibility";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useContext } from "react";
import type { MouseEvent } from "react";

interface WaveDropActionsSetPinnedDropProps {
  readonly drop: ApiDrop;
  readonly onPinnedDropSet?: (() => void) | undefined;
  readonly variant?: "desktop" | "mobile";
}

export default function WaveDropActionsSetPinnedDrop({
  drop,
  onPinnedDropSet,
  variant = "desktop",
}: WaveDropActionsSetPinnedDropProps) {
  const isMobile = variant === "mobile";
  const auth = useContext(AuthContext);
  const { requestAuth, setToast } = auth;
  const hasProfileSession = canReplyFromSession(auth);
  const { isPending, pendingDropId, setPinnedDrop } = useSetWavePinnedDrop(
    drop.wave.id,
    {
      onSuccess: () => {
        setToast({
          message: "Pinned drop updated.",
          type: "success",
        });
        onPinnedDropSet?.();
      },
      onError: (message) => {
        setToast({
          message,
          type: "error",
        });
      },
    }
  );
  const isUpdating = isPending && pendingDropId === drop.id;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!hasProfileSession || isUpdating) {
      return;
    }

    void (async () => {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }

      try {
        await setPinnedDrop({ dropId: drop.id });
      } catch {
        // Toast reporting is handled in the mutation callbacks.
      }
    })();
  };

  if (!hasProfileSession) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating}
      className={
        isMobile
          ? "tw-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
          : "tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
      }
    >
      {isUpdating ? (
        <svg
          className={
            isMobile
              ? "tw-h-5 tw-w-5 tw-flex-shrink-0 tw-animate-spin tw-text-iron-300"
              : "tw-h-4 tw-w-4 tw-flex-shrink-0 tw-animate-spin"
          }
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="tw-opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="tw-opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <MapPinIcon
          className={
            isMobile
              ? "tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              : "tw-h-4 tw-w-4 tw-flex-shrink-0"
          }
        />
      )}
      <span
        className={
          isMobile
            ? "tw-text-base tw-font-semibold tw-text-iron-300"
            : "tw-text-sm tw-font-medium"
        }
      >
        {isUpdating ? "Updating pinned drop..." : "Set as pinned drop"}
      </span>
    </button>
  );
}
