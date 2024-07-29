import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserLevel from "../utils/level/UserLevel";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import { useAccount } from "wagmi";
import { useContext, useEffect, useState } from "react";
import {
  amIUser,
  formatTimestampToMonthYear,
  getRandomColor,
} from "../../../helpers/Helpers";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useRouter } from "next/router";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../helpers/Types";
import { AuthContext } from "../../auth/Auth";
import dynamic from "next/dynamic";
import UserPageHeaderFollow from "./UserPageHeaderFollow";

const DEFAULT_BANNER_1 = getRandomColor();
const DEFAULT_BANNER_2 = getRandomColor();

const UserPageHeaderBanner = dynamic(
  () => import("./banner/UserPageHeaderBanner"),
  {
    ssr: false,
  }
);

const UserPageHeaderPfp = dynamic(() => import("./pfp/UserPageHeaderPfp"), {
  ssr: false,
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
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const getCanEdit = (): boolean => {
    return !!(profile.profile?.handle && isMyProfile && !activeProfileProxy);
  };

  const [canEdit, setCanEdit] = useState<boolean>(getCanEdit());

  useEffect(() => {
    setCanEdit(getCanEdit());
  }, [profile, isMyProfile, activeProfileProxy]);

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
    <div className="tailwind-scope">
      <section className="tw-pb-6 md:tw-pb-8">
        <UserPageHeaderBanner
          profile={profile}
          defaultBanner1={DEFAULT_BANNER_1}
          defaultBanner2={DEFAULT_BANNER_2}
          canEdit={canEdit}
        />
        <div className="tw-relative tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-flex tw-flex-col">
            <div className="tw-flex tw-justify-between">
              <div className="-tw-mt-16 sm:-tw-mt-24 tw-w-min">
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
              <div className="tw-mt-4">
                {connectedProfile?.profile?.handle &&
                  !activeProfileProxy &&
                  !isMyProfile &&
                  profile.profile?.handle && (
                    <UserPageHeaderFollow handle={profile.profile.handle} />
                  )}
              </div>
            </div>

            <UserPageHeaderName
              profile={profile}
              canEdit={canEdit}
              mainAddress={mainAddress}
            />

            <div className="tw-mt-2">
              <UserLevel level={profile.level} />
            </div>
            {showAbout && (
              <UserPageHeaderAbout
                profile={profile}
                statement={aboutStatement}
                canEdit={canEdit}
              />
            )}
            <UserPageHeaderStats profile={profile} />
            {profile.profile?.created_at && (
              <div className="tw-mt-2">
                <p
                  className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal"
                  suppressHydrationWarning
                >
                  Profile Enabled:{" "}
                  {formatTimestampToMonthYear(
                    new Date(profile.profile.created_at).getTime()
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
