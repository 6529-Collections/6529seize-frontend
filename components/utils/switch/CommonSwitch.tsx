export default function CommonSwitch({
  label,
  isOn,
  setIsOn,
}: {
  readonly label: string;
  readonly isOn: boolean;
  readonly setIsOn: (isOn: boolean) => void;
}) {
  const onBackground = "tw-bg-primary-500";
  const offBackground = "tw-bg-neutral-700";
  const toggleOnPosition = "tw-translate-x-5";
  const toggleOffPosition = "tw-translate-x-0";

  const backGroundColor = isOn ? onBackground : offBackground;
  const togglePosition = isOn ? toggleOnPosition : toggleOffPosition;

  const onToggle = () => setIsOn(!isOn);

  return (
    <div className="tw-flex tw-items-center">
      <button
        onClick={onToggle}
        type="button"
        className={`${backGroundColor} tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none`}
        role="switch"
        aria-checked="false"
        aria-label={label}
      >
        <span
          aria-hidden="true"
          className={`${togglePosition} tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out`}
        ></span>
      </button>
      <span className="tw-ml-3 tw-text-sm">
        <span className="tw-font-medium tw-text-iron-300">{label}</span>
      </span>
    </div>
  );
}
