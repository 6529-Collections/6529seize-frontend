import { IProfileAndConsolidations } from "../../../entities/IProfile";
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
import { getRandomColor } from "../../../helpers/Helpers";
import { Inter } from "next/font/google";

const DEFAULT_BANNER_1 = getRandomColor();
const DEFAULT_BANNER_2 = getRandomColor();

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

  return (
    <div className={`tailwind-scope ${inter.className}`}>
      <section className="tw-pb-16">
        <div
          className="tw-h-36"
          style={{
            background: `linear-gradient(45deg, ${
              profile.profile?.banner_1 ?? DEFAULT_BANNER_1
            } 0%, ${profile.profile?.banner_2 ?? DEFAULT_BANNER_2} 100%)`,
          }}
        ></div>
        <div className="tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
          <div className="tw-w-full tw-flex tw-gap-x-6 tw-flex-wrap tw-items-start tw-justify-between">
            <div>
              <div className="-tw-mt-24">
                <UserPageHeaderPfp
                  profile={profile}
                  defaultBanner1={DEFAULT_BANNER_1}
                  defaultBanner2={DEFAULT_BANNER_2}
                />
              </div>
              {dataLoaded ? (
                <>
                  <UserPageHeaderName
                    profile={profile}
                    mainAddress={mainAddress}
                    consolidatedTDH={consolidatedTDH}
                  />

                  <UserPageHeaderLevel level={profile.level} />
                  <UserPageHeaderStats consolidatedTDH={consolidatedTDH} />
                </>
              ) : (
                <DotLoader />
              )}
            </div>
            <div className="tw-mt-6 md:tw-hidden">
              {isLoggedInUser && <UserEditProfileButton user={user} />}
            </div>
            <div className="tw-w-full md:tw-w-auto tw-flex tw-mt-4 min-[347px]:tw-mt-6 tw-items-center tw-gap-x-6">
              <div className="tw-hidden md:tw-block">
                {isLoggedInUser && <UserEditProfileButton user={user} />}
              </div>
              <div className="tw-w-full sm:tw-w-auto">
                <UserPageHeaderAddresses
                  addresses={profile.consolidation.wallets}
                  activeAddress={activeAddress}
                  onActiveAddress={onActiveAddress}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
