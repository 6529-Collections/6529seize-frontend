import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActionsRate from "./WaveDetailedDropActionsRate";
import WaveDetailedDropActionsReply from "./WaveDetailedDropActionsReply";
import WaveDetailedDropActionsQuote from "./WaveDetailedDropActionsQuote";
import WaveDetailedDropActionsCopyLink from "./WaveDetailedDropActionsCopyLink";
import WaveDetailedDropActionsOptions from "./WaveDetailedDropActionsOptions";
import { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";

interface WaveDetailedDropActionsProps {
  readonly drop: Drop;
  readonly activePartIndex: number;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

export default function WaveDetailedDropActions({
  drop,
  activePartIndex,
  onReply,
  onQuote,
}: WaveDetailedDropActionsProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getShowOptions = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      return false;
    }

    return connectedProfile.profile.handle === drop.author.handle;
  };

  return (
    <div className="tw-absolute tw-right-2 tw-top-1 group-hover:tw-block tw-hidden tw-transition tw-duration-300 tw-ease-linear">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-shadow tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 tw-ring-inset tw-rounded-lg">
          <button
            type="button"
            className="tw-text-iron-500 icon tw-px-2 tw-py-1.5 tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-inline-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
          >
            <svg
              className="tw-flex-shrink-0 tw-size-4 tw-transition tw-ease-out tw-duration-300"
              width="17"
              height="15"
              viewBox="0 0 17 15"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <WaveDetailedDropActionsReply
            onReply={onReply}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDetailedDropActionsQuote
            onQuote={onQuote}
            drop={drop}
            activePartIndex={activePartIndex}
          />

          <WaveDetailedDropActionsCopyLink drop={drop} />
          {getShowOptions() && <WaveDetailedDropActionsOptions drop={drop} />}
        </div>
        <WaveDetailedDropActionsRate drop={drop} />
      </div>
    </div>
  );
}
