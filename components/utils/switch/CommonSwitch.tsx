interface CommonSwitchProps {
  readonly label: string;
  readonly isOn: boolean;
  readonly setIsOn: (isOn: boolean) => void;
}

const generateDescriptionId = (label: string): string => 
  `${label.toLowerCase().replace(/\s+/g, '-')}-description`;

export default function CommonSwitch({
  label,
  isOn,
  setIsOn,
}: CommonSwitchProps): React.JSX.Element {
  const onBackground = "tw-bg-primary-500";
  const offBackground = "tw-bg-iron-700";
  const toggleOnPosition = "tw-translate-x-5";
  const toggleOffPosition = "tw-translate-x-0";

  const backGroundColor = isOn ? onBackground : offBackground;
  const togglePosition = isOn ? toggleOnPosition : toggleOffPosition;

  const onToggle = () => setIsOn(!isOn);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="tw-flex tw-items-center">
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        type="button"
        className={`${backGroundColor} tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2`}
        role="switch"
        aria-checked={isOn}
        aria-label={`${label} toggle, currently ${isOn ? 'on' : 'off'}. Press Enter or Space to toggle.`}
        aria-describedby={generateDescriptionId(label)}
      >
        <span
          aria-hidden="true"
          className={`${togglePosition} tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out`}
        ></span>
      </button>
      <span className="tw-ml-3 tw-text-sm">
        <span className="tw-font-medium tw-text-iron-300">{label}</span>
        <span 
          id={generateDescriptionId(label)}
          className="tw-sr-only"
        >
          Toggle to {isOn ? 'disable' : 'enable'} {label.toLowerCase()} filtering
        </span>
      </span>
    </div>
  );
}
