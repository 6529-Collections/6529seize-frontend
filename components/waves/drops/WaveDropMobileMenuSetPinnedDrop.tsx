"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useSetWavePinnedDrop } from "@/hooks/waves/useSetWavePinnedDrop";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useContext } from "react";
import type { MouseEvent } from "react";

interface WaveDropMobileMenuSetPinnedDropProps {
  readonly drop: ApiDrop;
  readonly onPinnedDropSet: () => void;
}

export default function WaveDropMobileMenuSetPinnedDrop({
  drop,
  onPinnedDropSet,
}: WaveDropMobileMenuSetPinnedDropProps) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { isPending, pendingDropId, setPinnedDrop } = useSetWavePinnedDrop(
    drop.wave.id,
    {
      onSuccess: () => {
        setToast({
          message: "Pinned drop updated.",
          type: "success",
        });
        onPinnedDropSet();
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
    if (isUpdating) {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating}
      className="tw-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      {isUpdating ? (
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-animate-spin tw-text-iron-300"
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
        <MapPinIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
      )}
      <span className="tw-text-base tw-font-semibold tw-text-iron-300">
        {isUpdating ? "Updating pinned drop..." : "Set as pinned drop"}
      </span>
    </button>
  );
}
