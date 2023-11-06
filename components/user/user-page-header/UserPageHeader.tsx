import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { formatNumber } from "../../../helpers/Helpers";
import { Inter } from "next/font/google";
import Image from "next/image";
import UserPageHeaderAddresses from "./addresses/UserPageHeaderAddresses";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserPageHeader({
  profile,
  activeAddress,
  onActiveAddress,
}: {
  profile: IProfileAndConsolidations;
  activeAddress: string | null;
  onActiveAddress: (address: string) => void;
}) {
  const value = 16942069;
  return (
    <div className="tailwind-scope">
      <section className="tw-pb-16">
        <div className="tw-bg-[#1F2126] tw-h-36"></div>
        <div className="tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
          <div className="tw-w-full tw-flex tw-justify-between">
            <div className="-tw-mt-24">
              <Image
                src="/test.webp"
                alt="Profile picture"
                width="176"
                height="176"
                className="tw-flex-shrink-0 tw-h-44 tw-w-44 tw-rounded-lg tw-ring-[3px] tw-ring-white/30"
              />
            </div>
            <UserPageHeaderAddresses
              addresses={profile.consolidation.wallets}
              activeAddress={activeAddress}
              onActiveAddress={onActiveAddress}
            />
          </div>

          <div className="tw-mt-2">
            <div className="tw-inline-flex tw-items-center tw-space-x-2">
              <p className="tw-mb-0 tw-text-3xl tw-font-semibold">
                Punk6529
              </p>
              <svg
                className="tw-h-4 tw-w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="24" height="24" rx="12" fill="#45B26B" />
                <path
                  d="M7.5 12L10.5 15L16.5 9"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="tw-block tw-text-neutral-400 tw-font-normal tw-text-[13px] tw-leading-3">
              Pseudonym
            </div>
          </div>

          <div className="tw-mt-4">
            <span className="tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-text-base tw-font-semibold tw-text-[#55B075] tw-ring-2 tw-ring-inset tw-ring-[#55B075]">
              Level 1
            </span>
            {/*  nii texti kui ka ringi värvid muutuvad */}
            {/*  green: #55B075 */}
            {/*  yellow-green: #AABE68 */}
            {/* yellow: #DAC660 */}
            {/* yellow-orange: #DAAC60 */}
            {/* orange: #DA8C60 */}
          </div>

          <div className="tw-mt-6">
            <div className="tw-flex tw-gap-x-8">
              <div className="tw-flex tw-flex-col">
                <span className="tw-block tw-text-sm tw-font-medium tw-text-neutral-400">
                  Total days held
                </span>
                <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-x-2">
                  <span className="tw-text-base tw-font-semibold tw-text-white">
                    #89
                  </span>
                  <span className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-neutral-800 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-neutral-300 tw-ring-1 tw-ring-inset tw-ring-neutral-500/5">
                    331K
                  </span>
                </div>
              </div>
              <div className="tw-flex tw-flex-col">
                <span className="tw-block tw-text-sm tw-font-medium tw-text-neutral-400">
                  Reputation
                </span>
                <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-x-2">
                  <span className="tw-text-base tw-font-semibold tw-text-white">
                    #101
                  </span>
                  <span className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-neutral-800 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-neutral-300 tw-ring-1 tw-ring-inset tw-ring-neutral-500/5">
                    225.2K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*   
      {formatNumber(value)} (Rep: Soon™)
      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        activeAddress={activeAddress}
        onActiveAddress={onActiveAddress}
      /> */}
    </div>
  );
}
