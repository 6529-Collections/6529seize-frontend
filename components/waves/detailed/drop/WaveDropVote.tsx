import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import { useState } from "react";
import DropListItemRateGiveSubmit from "../../../drops/view/item/rate/give/DropListItemRateGiveSubmit";
import { DropVoteState } from "../../../drops/view/item/DropsListItem";
import WaveDropVoteQuick from "./WaveDropVoteQuick";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { WaveDropVoteInput } from "./WaveDropVoteInput";
import { WaveDropVoteSlider } from "./WaveDropVoteSlider";
import { TabToggle } from "../../../common/TabToggle";
import { WaveDropVoteSubmit } from "./WaveDropVoteSubmit";

interface WaveDropVoteProps {
  readonly drop: ApiDrop;
}

export const WaveDropVote: React.FC<WaveDropVoteProps> = ({ drop }) => {
  const availableCredit = Math.abs(
    (drop.context_profile_context?.max_rating ?? 0) -
      (drop.context_profile_context?.rating ?? 0)
  );

  const [voteValue, setVoteValue] = useState<number | string>(1);
  const [isSliderMode, setIsSliderMode] = useState(true);

  const onSuccessfulRateChange = () => {
    setVoteValue(1);
  };

  const voteOptions = [
    { key: "slider", label: "Slider" },
    { key: "numeric", label: "Numeric" },
  ] as const;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-5 tw-rounded-xl tw-bg-iron-900 tw-backdrop-blur-lg tw-border tw-border-iron-800/30">
      <div className="tw-relative">
        <div className="tw-absolute tw-top-[-12px] tw-right-[-12px]">
          <TabToggle
            options={voteOptions}
            activeKey={isSliderMode ? "slider" : "numeric"}
            onSelect={(key) => setIsSliderMode(key === "slider")}
          />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-6 tw-mt-4">
        <div className="tw-flex tw-gap-4">
          <div className="tw-flex-1 tw-h-[38px]">
            <div className="tw-relative tw-w-full tw-h-full">
              <div
                className={`tw-absolute tw-inset-0 tw-transition-all tw-duration-300 tw-ease-in-out
                ${
                  isSliderMode
                    ? "tw-opacity-100 tw-translate-y-0"
                    : "tw-opacity-0 tw-translate-y-2 tw-pointer-events-none"
                }`}
              >
                <WaveDropVoteSlider
                  voteValue={voteValue}
                  currentVoteValue={drop.context_profile_context?.rating ?? 0}
                  setVoteValue={setVoteValue}
                  availableCredit={availableCredit}
                />
              </div>
              <div
                className={`tw-absolute tw-inset-0 tw-transition-all tw-duration-300 tw-ease-in-out
                ${
                  !isSliderMode
                    ? "tw-opacity-100 tw-translate-y-0"
                    : "tw-opacity-0 tw-translate-y-2 tw-pointer-events-none"
                }`}
              >
                <WaveDropVoteInput
                  voteValue={voteValue}
                  currentVoteValue={drop.context_profile_context?.rating ?? 0}
                  setVoteValue={setVoteValue}
                  availableCredit={availableCredit}
                />
              </div>
            </div>
          </div>

          <div className="tw-flex-shrink-0 tw-flex tw-items-center">
            <WaveDropVoteSubmit
              rate={Number(voteValue) || 0}
              dropId={drop.id}
              onSubmit={onSuccessfulRateChange}

            />
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-400">
          <div className="tw-flex tw-items-center tw-gap-1">
            <span>
              Your votes:{" "}
              <span className="tw-text-iron-200">
                {formatNumberWithCommas(
                  drop.context_profile_context?.rating ?? 0
                )}{" "}
                TDH
              </span>
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-1">
            <span>
              Remaining:{" "}
              <span className="tw-text-iron-200">
                {formatNumberWithCommas(availableCredit)} TDH
              </span>
            </span>
          </div>
        </div>
      </div>

      {drop.rank !== 1 && (
        <WaveDropVoteQuick drop={drop} setValue={setVoteValue} />
      )}
    </div>
  );
};
