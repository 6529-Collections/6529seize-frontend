import { ExtendedWaveParticipationRequirement } from "./CreateWaveDropsTypes.constants";

export default function CreateWaveDropsType({
  isChecked,
  type,
  onRequiredTypeChange,
}: {
  readonly isChecked: boolean;
  readonly type: ExtendedWaveParticipationRequirement;
  readonly onRequiredTypeChange: (
    type: ExtendedWaveParticipationRequirement
  ) => void;
}) {
  const LABELS: Record<ExtendedWaveParticipationRequirement, string> = {
    [ExtendedWaveParticipationRequirement.NONE]: "None",
    [ExtendedWaveParticipationRequirement.IMAGE]: "Image",
    [ExtendedWaveParticipationRequirement.AUDIO]: "Audio",
    [ExtendedWaveParticipationRequirement.VIDEO]: "Video",
  };

  const buttonClasses = isChecked
    ? "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30"
    : "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10";

  const labelClasses = isChecked
    ? "tw-text-white"
    : "tw-text-iron-300 group-hover:tw-text-white";

  return (
    <label
      className={`${buttonClasses} tw-group tw-relative tw-flex tw-min-h-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-3 tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
    >
      <input
        checked={isChecked}
        onChange={() => onRequiredTypeChange(type)}
        type="radio"
        name="required-media-type"
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
          isChecked
            ? "tw-border-primary-400 tw-bg-primary-500/10"
            : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
        }`}
      >
        <span
          className={`tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
            isChecked ? "tw-scale-100" : "tw-scale-0"
          }`}
        />
      </span>
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span className={`${labelClasses} tw-text-sm tw-font-semibold`}>
          {LABELS[type]}
        </span>
      </div>
    </label>
  );
}
