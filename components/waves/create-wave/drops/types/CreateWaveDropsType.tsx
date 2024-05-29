import { CREATE_WAVE_DROPS_REQUIRED_TYPES_LABELS } from "../../../../../helpers/waves/waves.constants";
import { WaveRequiredType } from "../../../../../types/waves.types";

export default function CreateWaveDropsType({
  requiredTypes,
  type,
  onRequiredTypeChange,
}: {
  readonly requiredTypes: WaveRequiredType[];
  readonly type: WaveRequiredType;
  readonly onRequiredTypeChange: (type: WaveRequiredType) => void;
}) {
  const isChecked = requiredTypes.includes(type);
  const buttonClasses = isChecked
    ? "tw-ring-primary-400 tw-bg-primary-400/10"
    : "tw-ring-iron-700 tw-bg-iron-800 hover:tw-ring-iron-600";

  const labelClasses = isChecked
    ? "tw-font-bold tw-text-primary-400"
    : "tw-font-semibold tw-text-iron-300";
  return (
    <div
      onClick={() => onRequiredTypeChange(type)}
      className={`${buttonClasses} tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset  tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className="tw-flex tw-h-6 tw-items-center">
        <input
          checked={isChecked}
          onChange={() => onRequiredTypeChange(type)}
          type="checkbox"
          className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
      </div>
      <span className="tw-flex tw-items-center">
        <span className="tw-flex tw-flex-col tw-text-base">
          <span className={labelClasses}>
            {CREATE_WAVE_DROPS_REQUIRED_TYPES_LABELS[type]}
          </span>
        </span>
      </span>
    </div>
  );
}
