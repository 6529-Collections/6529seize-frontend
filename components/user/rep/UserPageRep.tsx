import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserPageRepRaters from "./UserPageRepRaters";
import UserPageRepActivityLog from "./UserPageRepActivityLog";
import UserPageRepNewRep from "./add-rep/UserPageRepNewRep";

export default function UserPageRep({
  profile,
  repRates,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly repRates: ApiProfileRepRatesState;
}) {
  console.log(repRates);
  return (
    <div className="tailwind-scope">
      {/*  1st */}
      <div>
        <div className="tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1">
              <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200">
                <div className="tw-flex tw items-center tw-space-x-1">
                  <span>Rep:</span>
                  <span>225</span>
                </div>
              </div>
              <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200 tw-space-x-1">
                <span>Raters:</span>
                <span>1,234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*  1st end */}

      <UserPageRepNewRep />

      {/*  3rd start */}
      <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-4">
        <div>
          <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-lg tw-bg-iorn-900 tw-bordet tw-border-solid tw-border-white/10 tw-px-3 tw-py-1.5">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-200">
              Wine Expert
            </span>
            <span className="tw-whitespace-nowrap tw-text-green tw-font-semibold tw-text-sm">
              +500
              <span className="tw-ml-1 tw-text-[0.6875rem] tw-leading-5 tw-text-iron-400 tw-font-semibold">
                (+80)
              </span>
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-smedium tw-text-iron-200">
              123
            </span>
            <button
              type="button"
              className="tw-group tw-relative tw-inline-flex tw-items-center tw-text-sm tw-font-medium tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <span className="tw-sr-only">Edit</span>
              <svg
                className="tw-h-5 tw-w-5 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
        </div>
        <div>
          <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-lg tw-bg-iorn-900 tw-bordet tw-border-solid tw-border-white/10 tw-px-3 tw-py-1.5">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-200">
              Typescript Expertlonglonglong
            </span>
            <span className="tw-whitespace-nowrap tw-text-green tw-font-semibold tw-text-sm">
              +500
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-smedium tw-text-iron-200">
              123
            </span>
            <button
              type="button"
              className="tw-group tw-relative tw-inline-flex tw-items-center tw-text-sm tw-font-medium tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <span className="tw-sr-only">Add rep</span>
              <svg
                className="tw-h-5 tw-w-5 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
        </div>
      </div>
      {/*  3rd end */}

      {/*  4th start */}
      <div className="tw-mt-10 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-10 tw-gap-x-10">
        <div>
          <UserPageRepRaters />
        </div>
        <div>
          <UserPageRepRaters />
        </div>
      </div>
      {/*  4th end */}

      {/*  5th start */}
      <div className="tw-mt-10">
        <UserPageRepActivityLog />
      </div>
    </div>
  );
}
