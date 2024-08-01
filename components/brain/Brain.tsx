import { useContext } from "react";
import { AuthContext, WAVES_MIN_ACCESS_LEVEL } from "../auth/Auth";
import Link from "next/link";
import StreamDiscovery from "./discovery/StreamDiscovery";
import MyStream from "./my-stream/MyStream";

export default function Brain() {
  const { showWaves } = useContext(AuthContext);

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-pt-8 tw-pb-14 lg:tw-pb-24 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
      <div className="md:tw-flex tw-justify-center ">
        <div className="tw-text-iron-500 tw-text-sm tw-py-4">
          These pages are in closed alpha for level {WAVES_MIN_ACCESS_LEVEL} and
          above. They are not ready for public release. Lots of improvements and
          bugs to fix. Currently only &quot;chat&quot; waves are active.
        </div>
      </div>

      <div className="md:tw-flex tw-justify-center tw-gap-x-5 xl:tw-ml-16">
        <MyStream />
        <div className="md:tw-w-[27%]">
          <div className="tw-mt-16">
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

          <StreamDiscovery />
        </div>
      </div>
    </div>
  );
}
