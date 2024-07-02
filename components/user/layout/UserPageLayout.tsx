import Head from "next/head";
import { ReactNode, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import {
  containsEmojis,
  formatAddress,
  formatNumberWithCommas,
} from "../../../helpers/Helpers";
import UserPageHeader from "../user-page-header/UserPageHeader";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageTabs from "./UserPageTabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";

const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DEFAULT_IMAGE =
  "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_2.png";

export default function UserPageLayout({
  profile: initialProfile,
  children,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setProfile } = useContext(ReactQueryWrapperContext);
  const handleOrWallet = (router.query.user as string).toLowerCase();

  const profileInit = queryClient.getQueryData<IProfileAndConsolidations>([
    QueryKey.PROFILE,
    handleOrWallet,
  ]);

  if (!profileInit) {
    setProfile(initialProfile);
  }

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, handleOrWallet],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${handleOrWallet}`,
      }),
    enabled: !!handleOrWallet,
    initialData: initialProfile,
  });

  const getTitle = (): string => {
    if (profile.profile?.handle) {
      return profile.profile.handle;
    }
    if (
      profile.consolidation.consolidation_display &&
      !containsEmojis(profile.consolidation.consolidation_display)
    ) {
      return profile.consolidation.consolidation_display;
    }
    return formatAddress(handleOrWallet);
  };

  const title = getTitle();

  const pagenameFull = `${title} | 6529 SEIZE`;

  const descriptionArray = [];

  descriptionArray.push(`Level: ${formatNumberWithCommas(profile.level)}`);

  descriptionArray.push(
    `CIC: ${formatNumberWithCommas(profile.cic.cic_rating)}`
  );
  descriptionArray.push(`Rep: ${formatNumberWithCommas(profile.rep)}`);
  descriptionArray.push(
    `TDH: ${formatNumberWithCommas(profile.consolidation.tdh)}`
  );
  descriptionArray.push(`Cards: ${formatNumberWithCommas(profile.balance)}`);

  descriptionArray.push("6529 SEIZE");

  const mainAddress =
    profile.profile?.primary_wallet ?? handleOrWallet.toLowerCase();
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  useEffect(() => {
    const handleStart = (toPath: string, options: { shallow: boolean }) => {
      const toUser = toPath.split("/")[1].toLowerCase();
      setIsLoadingTabData(
        toUser.toLowerCase() === (router.query.user as string).toLowerCase() &&
          !options.shallow
      );
    };

    const handleComplete = () => {
      setIsLoadingTabData(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router.query.user]);

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={title} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${handleOrWallet}`}
        />
        <meta property="og:title" content={title} />
        <meta
          property="og:image"
          content={profile.profile?.pfp_url ?? DEFAULT_IMAGE}
        />
        <meta
          property="og:description"
          content={descriptionArray.join(" \n ")}
        />
      </Head>

      <main className="tw-min-h-[100dvh]">
        <Header />
        <div
          className="tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20"
        >
          <UserPageHeader profile={profile} mainAddress={mainAddress} />
          <div className="tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
            <UserPageTabs />
            <div className="tw-mt-6 lg:tw-mt-8">
              {isLoadingTabData ? (
                <div className="tw-text-base tw-font-normal tw-text-iron-200">
                  Loading...
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
