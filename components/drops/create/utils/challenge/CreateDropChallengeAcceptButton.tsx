import { useState } from "react";

export default function CreateDropChallengeAcceptButton() {
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  const getButtonClasses = () => {
    if (isAccepted) {
      return "tw-bg-gradient-radial hover:tw-shadow-drop-btn-active tw-text-white";
    } else {
      return "hover:tw-border-none tw-bg-iron-700";
    }
  };

  const getSvgClasses = () => {
    if (isAccepted) {
      return "tw-text-iron-100";
    } else {
      return "tw-text-iron-600";
    }
  };
  return (
    <div className="tw-self-end">
      <button
        onClick={() => setIsAccepted(!isAccepted)}
        type="button"
        className={`${getButtonClasses()} hover:tw-scale-105 tw-group focus:tw-outline-none active:tw-bg-inherit tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-h-[44px] tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out tw-transform`}
      >
        <svg
          className={`${getSvgClasses()} tw-h-4 tw-w-4 tw-transition tw-duration-300 tw-ease-out`}
          enableBackground="new 0 0 512.026 512.026"
          aria-hidden="true"
          height="512"
          viewBox="0 0 512.026 512.026"
          width="512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            <path
              fill="currentColor"
              d="m184.08 168.475c0-6.176 0-24.972-32.198-75.789-15.122-23.868-30.016-43.309-30.643-44.125l-11.896-15.491-11.896 15.491c-.627.816-15.52 20.258-30.643 44.125-32.197 50.817-32.197 69.613-32.197 75.789 0 41.21 33.526 74.736 74.736 74.736s74.737-33.526 74.737-74.736z"
            ></path>
            <path
              fill="currentColor"
              d="m453.366 47.887c-11.097-17.514-22.038-31.796-22.499-32.396l-11.896-15.491-11.896 15.491c-.46.6-11.402 14.882-22.499 32.396-10.326 16.297-24.053 39.969-24.053 57.313 0 32.229 26.22 58.448 58.448 58.448s58.448-26.22 58.448-58.448c0-17.345-13.727-41.016-24.053-57.313z"
            ></path>
            <path
              fill="currentColor"
              d="m291.862 151.462-11.896-15.491-11.896 15.491c-1.22 1.589-30.217 39.44-59.705 85.981-40.649 64.156-61.26 111.838-61.26 141.721 0 73.26 59.602 132.862 132.862 132.862s132.861-59.602 132.861-132.862c0-29.883-20.611-77.565-61.26-141.721-29.489-46.541-58.485-84.392-59.706-85.981z"
            ></path>
          </g>
        </svg>
      </button>
    </div>
  );
}
