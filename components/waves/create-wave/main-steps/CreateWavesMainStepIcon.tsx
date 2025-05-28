import { useState, type JSX } from "react";
import { CreateWaveStepStatus } from "../../../../types/waves.types";
import { useDebounce } from "react-use";

export default function CreateWavesMainStepIcon({
  stepStatus,
}: {
  readonly stepStatus: CreateWaveStepStatus;
}) {
  const [debounceStepStatus, setDebounceStepStatus] = useState(stepStatus);
  useDebounce(
    () => {
      setDebounceStepStatus(stepStatus);
    },
    stepStatus === CreateWaveStepStatus.ACTIVE ? 500 : 0,
    [stepStatus]
  );

  const WRAPPER_CLASSES: Record<CreateWaveStepStatus, string> = {
    [CreateWaveStepStatus.DONE]:
      "tw-ring-primary-500 tw-bg-primary-600 tw-delay-0",
    [CreateWaveStepStatus.ACTIVE]:
      "tw-ring-primary-500 tw-bg-primary-600 tw-shadow-[0_0_0_6px_rgba(41,112,255,0.24)] tw-delay-500",
    [CreateWaveStepStatus.PENDING]:
      "tw-ring-iron-700 tw-bg-iron-900 tw-delay-0",
  };

  const components: Record<CreateWaveStepStatus, JSX.Element> = {
    [CreateWaveStepStatus.DONE]: (
      <svg
        width="13"
        height="11"
        className="tw-text-white"
        viewBox="0 0 13 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.0965 0.390037L3.9365 7.30004L2.0365 5.27004C1.6865 4.94004 1.1365 4.92004 0.736504 5.20004C0.346504 5.49004 0.236503 6.00004 0.476503 6.41004L2.7265 10.07C2.9465 10.41 3.3265 10.62 3.7565 10.62C4.1665 10.62 4.5565 10.41 4.7765 10.07C5.1365 9.60004 12.0065 1.41004 12.0065 1.41004C12.9065 0.490037 11.8165 -0.319963 11.0965 0.380037V0.390037Z"
          fill="currentColor"
        />
      </svg>
    ),
    [CreateWaveStepStatus.ACTIVE]: (
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="4" cy="4" r="4" fill="white" />
      </svg>
    ),
    [CreateWaveStepStatus.PENDING]: (
      <svg
        width="8"
        height="8"
        className="tw-text-iron-500"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
    ),
  };

  return (
    <span
      data-testid="wave-step-icon"
      className={`${WRAPPER_CLASSES[stepStatus]} tw-relative tw-z-10 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-ring-2 tw-transform tw-transition tw-ease-out tw-duration-300`}
    >
      {components[debounceStepStatus]}
    </span>
  );
}
