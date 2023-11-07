import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { formatNumber } from "../../../helpers/Helpers";
import { Inter } from "next/font/google";
import Image from "next/image";
import UserPageHeaderAddresses from "./addresses/UserPageHeaderAddresses";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";
import UserPageHeaderPfp from "./userPageHeaderPfp";
import UserPageHeaderName from "./UserPageHeaderName";
import UserPageHeaderLevel from "./UserPageHeaderLevel";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import DotLoader from "../../dotLoader/DotLoader";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import UserEditProfileButton from "../settings/UserEditProfileButton";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserPageHeader({
  profile,
  mainAddress,
  activeAddress,
  onActiveAddress,
  consolidatedTDH,
  dataLoaded,
  user,
}: {
  profile: IProfileAndConsolidations;
  mainAddress: string;
  activeAddress: string | null;
  onActiveAddress: (address: string) => void;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  dataLoaded: boolean;
  user: string;
}) {
  const account = useAccount();
  const [isLoggedInUser, setIsLoggedInUser] = useState<boolean>(false);
  useEffect(() => {
    if (!account.address) {
      setIsLoggedInUser(false);
      return;
    }
    setIsLoggedInUser(
      profile.consolidation.wallets.some(
        (wallet) =>
          wallet.wallet.address.toLowerCase() === account.address!.toLowerCase()
      )
    );
  }, [account, profile]);

  const defaultBackground = "#1F2126";
  return (
    <div className="tailwind-scope">
      <section className="tw-pb-16">
        <div
          className="tw-h-36"
          style={{ background: profile.profile?.banner_1 ?? defaultBackground }}
        ></div>
        <div className="tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
          <div className="tw-w-full tw-flex tw-justify-between">
            <div className="-tw-mt-24">
              <UserPageHeaderPfp profile={profile} />
            </div>
            <div className="tw-flex tw-items-center tw-gap-x-6">
              <div>
                <button
                  type="button"
                  className="tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-bg-neutral-950 tw-px-4 tw-py-2 tw-text-sm tw-leading-6 tw-font-medium tw-text-neutral-200 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-500 tw-rounded-lg hover:tw-bg-white/5 tw-transition tw-duration-300 tw-ease-out"
                >
                  Edit profile
                </button>
              </div>
              <div>
                <UserPageHeaderAddresses
                  addresses={profile.consolidation.wallets}
                  activeAddress={activeAddress}
                  onActiveAddress={onActiveAddress}
                />
                {isLoggedInUser && <UserEditProfileButton user={user} />}
              </div>
            </div>
          </div>

          {dataLoaded ? (
            <>
              <UserPageHeaderName
                profile={profile}
                mainAddress={mainAddress}
                consolidatedTDH={consolidatedTDH}
              />

              <UserPageHeaderLevel consolidatedTDH={consolidatedTDH} />
              <UserPageHeaderStats consolidatedTDH={consolidatedTDH} />
            </>
          ) : (
            <DotLoader />
          )}
        </div>
      </section>
    </div>
  );
}
