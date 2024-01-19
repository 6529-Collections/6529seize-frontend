import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderLevel from "./UserPageHeaderLevel";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { amIUser, getRandomColor } from "../../../helpers/Helpers";
import { Inter } from "next/font/google";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useRouter } from "next/router";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../helpers/Types";

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
}: {
  readonly profile: IProfileAndConsolidations;
  readonly mainAddress: string;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const [canEdit, setCanEdit] = useState<boolean>(
    !!(profile.profile?.handle && isMyProfile)
  );

  useEffect(() => {
    setCanEdit(!!(profile.profile?.handle && isMyProfile));
  }, [profile, isMyProfile]);

  const { isFetched, data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      }),
    enabled: !!user,
  });

  const [aboutStatement, setAboutStatement] = useState<CicStatement | null>(
    null
  );
  useEffect(() => {
    const aboutStatement = statements?.find(
      (statement) =>
        statement.statement_type === STATEMENT_TYPE.BIO &&
        statement.statement_group === STATEMENT_GROUP.GENERAL
    );
    setAboutStatement(aboutStatement ?? null);
  }, [statements]);

  const [showAbout, setShowAbout] = useState<boolean>(false);

  useEffect(() => {
    if (!isFetched) {
      setShowAbout(false);
      return;
    }
    if (aboutStatement || canEdit) {
      setShowAbout(true);
      return;
    }
    setShowAbout(false);
  }, [aboutStatement, canEdit, isFetched]);

  return (
    <div className={`tailwind-scope ${inter.className}`}>
      <section className="tw-pb-6 md:tw-pb-8">
        <UserPageHeaderBanner
          profile={profile}
          defaultBanner1={DEFAULT_BANNER_1}
          defaultBanner2={DEFAULT_BANNER_2}
          canEdit={canEdit}
        />
        <div className="tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
          <div className="tw-w-full tw-flex tw-gap-x-6 tw-flex-wrap tw-items-start">
            <div>
              <div className="-tw-mt-20 sm:-tw-mt-24">
                <UserPageHeaderPfpWrapper profile={profile} canEdit={canEdit}>
                  <UserPageHeaderPfp
                    canEdit={canEdit}
                    profile={profile}
                    defaultBanner1={
                      profile.profile?.banner_1 ?? DEFAULT_BANNER_1
                    }
                    defaultBanner2={
                      profile.profile?.banner_2 ?? DEFAULT_BANNER_2
                    }
                  />
                </UserPageHeaderPfpWrapper>
              </div>
              <UserPageHeaderName
                profile={profile}
                canEdit={canEdit}
                mainAddress={mainAddress}
              />
              <UserPageHeaderLevel level={profile.level} />
              <UserPageHeaderStats profile={profile} />
            </div>
            {showAbout && (
              <UserPageHeaderAbout
                profile={profile}
                statement={aboutStatement}
                canEdit={canEdit}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
