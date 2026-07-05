"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getCopiedDropLink } from "@/helpers/waves/drop-copy-link.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import WaveDropMobileMenuCopyAction from "./WaveDropMobileMenuCopyAction";

interface WaveDropMobileMenuCopyLinkProps {
  readonly drop: ApiDrop;
  readonly onCopy: () => void;
}

export default function WaveDropMobileMenuCopyLink({
  drop,
  onCopy,
}: WaveDropMobileMenuCopyLinkProps) {
  const { isMemesWave, isQuorumWave } = useSeizeSettings();
  const myStream = useMyStreamOptional();
  const directMessageWaves = myStream?.directMessages.list ?? [];

  const getDropLink = () => {
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

    return getCopiedDropLink({
      drop,
      isDirectMessage: isWaveDirectMessage(
        drop.wave.id,
        waveDetails,
        directMessageWaves
      ),
      isMemesWave,
      isQuorumWave,
    });
  };

  return (
    <WaveDropMobileMenuCopyAction
      labelKey="waves.drop.actions.copyLink"
      disabled={drop.id.startsWith("temp-")}
      getText={getDropLink}
      onCopy={onCopy}
      icon={
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
      }
    />
  );
}
