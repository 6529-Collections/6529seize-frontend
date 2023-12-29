import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";
import UserPageHeaderPfp from "./userPageHeaderPfp";
import UserPageHeaderName from "./UserPageHeaderName";
import UserPageHeaderLevel from "./UserPageHeaderLevel";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
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
  consolidatedTDH,
  user,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly mainAddress: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly user: string;
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
      <section className="tw-pb-6 md:tw-pb-8">
        <div
          className="tw-h-28 sm:tw-h-36"
          style={{
            background: `linear-gradient(45deg, ${
              profile.profile?.banner_1 ?? DEFAULT_BANNER_1
            } 0%, ${profile.profile?.banner_2 ?? DEFAULT_BANNER_2} 100%)`,
          }}
        ></div>
        <div className="tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
          <div className="tw-w-full tw-flex tw-gap-x-6 tw-flex-wrap tw-items-start tw-justify-between">
            <div>
              <div className="-tw-mt-20 sm:-tw-mt-24">
                <UserPageHeaderPfp
                  profile={profile}
                  defaultBanner1={DEFAULT_BANNER_1}
                  defaultBanner2={DEFAULT_BANNER_2}
                />
              </div>
              <UserPageHeaderName
                profile={profile}
                mainAddress={mainAddress}
                consolidatedTDH={consolidatedTDH}
              />
              <UserPageHeaderLevel level={profile.level} />
              <UserPageHeaderStats profile={profile} />
            </div>
            <div className="tw-mt-6 md:tw-hidden">
              {isLoggedInUser && <UserEditProfileButton user={user} />}
            </div>
            <div className="tw-w-full md:tw-w-auto tw-flex md:tw-mt-6 tw-items-center tw-gap-x-3">
              <div className="tw-hidden md:tw-block">
                {isLoggedInUser && <UserEditProfileButton user={user} />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
