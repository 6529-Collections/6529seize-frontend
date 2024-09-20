import { ExtendedWaveParticipationRequirement } from "./CreateWaveDropsTypes";

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
    ? "tw-ring-primary-400 tw-bg-[#202B45]"
    : "tw-ring-iron-700 tw-bg-iron-800 hover:tw-ring-iron-600";

  const labelClasses = isChecked ? "tw-text-primary-400" : "tw-text-iron-300";
  return (
    <div
      onClick={() => onRequiredTypeChange(type)}
      className={`${buttonClasses} tw-flex-1 tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-4 tw-py-4 tw-shadow-sm focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className="tw-flex tw-h-6 tw-items-center">
        <input
          checked={isChecked}
          onChange={() => onRequiredTypeChange(type)}
          type="checkbox"
          className="tw-form-checkbox tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
      </div>
      <span className="tw-flex tw-items-center">
        <span className="tw-flex tw-flex-col tw-text-base tw-font-semibold">
          <span className={labelClasses}>
            {LABELS[type]}
          </span>
        </span>
      </span>
    </div>
  );
}
