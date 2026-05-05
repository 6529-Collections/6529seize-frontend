"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getCopiedDropLink } from "@/helpers/waves/drop-copy-link.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

interface WaveDropMobileMenuCopyLinkProps {
  readonly drop: ApiDrop;
  readonly onCopy: () => void;
}

export default function WaveDropMobileMenuCopyLink({
  drop,
  onCopy,
}: WaveDropMobileMenuCopyLinkProps) {
  const [copied, setCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(true);
  const { isMemesWave, isQuorumWave } = useSeizeSettings();
  const myStream = useMyStreamOptional();
  const directMessageWaves = myStream?.directMessages.list ?? [];
  const isTemporaryDrop = drop.id.startsWith("temp-");

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (copiedResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isTemporaryDrop) {
      return;
    }

    const clipboard = globalThis.navigator.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    if (typeof clipboard?.writeText !== "function") {
      onCopy();
      return;
    }

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
    const dropLink = getCopiedDropLink({
      drop,
      isDirectMessage: isWaveDirectMessage(
        drop.wave.id,
        waveDetails,
        directMessageWaves
      ),
      isMemesWave,
      isQuorumWave,
    });

    void clipboard
      .writeText(dropLink)
      .then(() => {
        if (!isMountedRef.current) {
          return;
        }

        setCopied(true);
        if (copiedResetTimeoutRef.current !== null) {
          globalThis.clearTimeout(copiedResetTimeoutRef.current);
        }
        copiedResetTimeoutRef.current = globalThis.setTimeout(() => {
          if (isMountedRef.current) {
            setCopied(false);
            copiedResetTimeoutRef.current = null;
            onCopy();
          }
        }, 2000);
      })
      .catch(() => {
        onCopy();
      });
  };

  return (
    <button
      type="button"
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
        aria-hidden="true"
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
  );
}
