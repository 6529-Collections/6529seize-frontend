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
        className={`${backGroundColor} tw-p-0 tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500`}
        role="switch"
        aria-checked="false"
        aria-labelledby="annual-billing-label"
      >
        <span
          aria-hidden="true"
          className={`${togglePosition} tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out`}
        ></span>
      </button>
      <span className="tw-ml-3 tw-text-sm" id="annual-billing-label">
        <span className="tw-font-medium tw-text-gray-100">{label}</span>
      </span>
    </div>
  );
}
