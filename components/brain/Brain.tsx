import { ReactNode, useContext, useEffect, useState } from "react";
import Link from "next/link";

import WavesListWrapper, { WavesListType } from "./waves/WavesListWrapper";
import { AuthContext } from "../auth/Auth";

export default function Brain({ children }: { readonly children: ReactNode }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowConnectedIdentityWaves = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showConnectedIdentityWaves, setShowConnectedIdentityWaves] = useState(
    getShowConnectedIdentityWaves()
  );

  useEffect(
    () => setShowConnectedIdentityWaves(getShowConnectedIdentityWaves()),
    [connectedProfile, activeProfileProxy]
  );

  return (
    <div>
      <div className="tailwind-scope tw-pt-6 tw-pb-14 lg:tw-pb-24 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-center tw-gap-x-5 tw-gap-y-4">
          <div>{children}</div>
          <div className="lg:tw-w-[27%]">
            <div>
              <Link
                href="/waves?new=true"
                className="tw-no-underline tw-w-full tw-justify-center tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
                <span>Create a Wave</span>
              </Link>
            </div>
            {showConnectedIdentityWaves && (
              <>
                <WavesListWrapper type={WavesListType.MY_WAVES} />
                <WavesListWrapper type={WavesListType.FOLLOWING} />
              </>
            )}
            <WavesListWrapper type={WavesListType.POPULAR} />
          </div>
        </div>
      </div>
    </div>
  );
}
