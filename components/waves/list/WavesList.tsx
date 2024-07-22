import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import WavesListWrapper from "./WavesListWrapper";

export default function WavesList({
  showCreateNewWaveButton,
  onCreateNewWave,
}: {
  readonly showCreateNewWaveButton?: boolean;
  readonly onCreateNewWave: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [showAllType, setShowAllType] = useState<WavesOverviewType | null>(
    null
  );

  const getWaveOverviewTypes = (): WavesOverviewType[] => {
    const types = showAllType
      ? Object.values(WavesOverviewType).filter((t) => t === showAllType)
      : Object.values(WavesOverviewType);
    if (!connectedProfile?.profile?.handle || !!activeProfileProxy) {
      return types.filter((t) => t !== WavesOverviewType.AuthorYouHaveRepped);
    }
    return types;
  };

  const [overviewTypes, setOverviewTypes] = useState(getWaveOverviewTypes());
  useEffect(
    () => setOverviewTypes(getWaveOverviewTypes()),
    [connectedProfile, activeProfileProxy, showAllType]
  );

  return (
    <div className="tailwind-scope">
      <div className="tw-pb-14 lg:tw-pb-24 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-mt-6 lg:tw-mt-8">
          <h1>Waves</h1>
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-3">
            <div>
              {showCreateNewWaveButton && (
                <button
                  onClick={onCreateNewWave}
                  type="button"
                  className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
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
                  <span>Create New</span>
                </button>
              )}
            </div>
            <div className="tw-max-w-sm tw-relative tw-w-full">
              <svg
                className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Search Waves"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
        </div>
        <div className="tw-mt-6">
          <div className="tw-space-y-12">
            {overviewTypes.map((type) => (
              <WavesListWrapper
                key={type}
                overviewType={type}
                showAllType={showAllType}
                setShowAllType={setShowAllType}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
