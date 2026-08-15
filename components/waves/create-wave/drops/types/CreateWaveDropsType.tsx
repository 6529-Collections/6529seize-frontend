import {
  faHeadphones,
  faImage,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ExtendedWaveParticipationRequirement } from "./CreateWaveDropsTypes.constants";

const ICONS = {
  [ExtendedWaveParticipationRequirement.NONE]: null,
  [ExtendedWaveParticipationRequirement.IMAGE]: faImage,
  [ExtendedWaveParticipationRequirement.AUDIO]: faHeadphones,
  [ExtendedWaveParticipationRequirement.VIDEO]: faVideo,
} as const;

export default function CreateWaveDropsType({
  isChecked,
  type,
  label,
  onRequiredTypeChange,
}: {
  readonly isChecked: boolean;
  readonly type: ExtendedWaveParticipationRequirement;
  readonly label: string;
  readonly onRequiredTypeChange: (
    type: ExtendedWaveParticipationRequirement
  ) => void;
}) {
  const icon = ICONS[type];
  const buttonClasses = isChecked
    ? "tw-border-primary-500/60 tw-bg-iron-900/80"
    : "tw-border-white/5 tw-bg-iron-950 hover:tw-border-white/10";

  const labelClasses = isChecked
    ? "tw-text-white"
    : "tw-text-iron-300 group-hover:tw-text-white";

  return (
    <label
      className={`${buttonClasses} tw-group tw-relative tw-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-gap-x-2.5 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400`}
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
        className={`tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
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
      {icon && (
        <FontAwesomeIcon
          aria-hidden="true"
          icon={icon}
          className={`tw-size-4 tw-flex-shrink-0 tw-transition-colors tw-duration-300 ${
            isChecked
              ? "tw-text-primary-400"
              : "tw-text-iron-500 group-hover:tw-text-iron-300"
          }`}
        />
      )}
      <span
        className={`${labelClasses} tw-min-w-0 tw-text-sm tw-font-semibold`}
      >
        {label}
      </span>
    </label>
  );
}
