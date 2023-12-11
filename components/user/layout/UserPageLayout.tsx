import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import { numberWithCommas } from "../../../helpers/Helpers";
import UserPageHeader from "../user-page-header/UserPageHeader";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";
import UserPageTabs from "./UserPageTabs";
import { Inter } from "next/font/google";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";

const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_IMAGE =
  "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_2.png";

interface UserPageLayoutProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

export default function UserPageLayout({
  props,
  children,
}: {
  props: UserPageLayoutProps;
  children: ReactNode;
}) {
  const router = useRouter();
  const user = router.query.user as string;

  const {
    isLoading: isLoadingProfile,
    isError,
    data: profile,
    error,
  } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user}`,
      }),
    enabled: !!user,
    initialData: props.profile,
  });

  const pagenameFull = `${props.title} | 6529 SEIZE`;

  const descriptionArray = [];
  if (profile.consolidation.tdh && profile.consolidation.tdh > 0) {
    descriptionArray.push(
      `TDH: ${numberWithCommas(profile.consolidation.tdh)}`
    );
  }
  if (props.consolidatedTDH?.balance && props.consolidatedTDH?.balance > 0) {
    descriptionArray.push(
      `Cards: ${numberWithCommas(props.consolidatedTDH?.balance)}`
    );
  }
  descriptionArray.push("6529 SEIZE");

  const mainAddress = profile.profile?.primary_wallet ?? user.toLowerCase();

  const getAddressFromQuery = (): string | null => {
    if (!router.query.address) {
      return null;
    }
    if (typeof router.query.address === "string") {
      return router.query.address.toLowerCase();
    }

    if (router.query.address.length > 0) {
      return router.query.address[0].toLowerCase();
    }
    return null;
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  const onActiveAddress = (address: string) => {
    if (address === activeAddress) {
      setActiveAddress(null);
      const currentQuery = { ...router.query };
      delete currentQuery.address;
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
      return;
    }
    setActiveAddress(address);
    const currentQuery = { ...router.query };
    currentQuery.address = address;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleComplete = () => {
      setIsLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={props.title} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${user}`}
        />
        <meta property="og:title" content={props.title} />
        <meta
          property="og:image"
          content={profile.profile?.pfp_url ?? DEFAULT_IMAGE}
        />
        <meta
          property="og:description"
          content={descriptionArray.join(" | ")}
        />
      </Head>

      <main className="tw-min-h-screen">
        <Header />
        <div
          className={`tw-bg-iron-950 tw-min-h-screen tw-pb-16 ${inter.className}`}
        >
          <UserPageHeader
            profile={profile}
            mainAddress={mainAddress}
            consolidatedTDH={props.consolidatedTDH}
            activeAddress={activeAddress}
            onActiveAddress={onActiveAddress}
            user={user}
          />
          <div className="tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto">
            <UserPageTabs />
            <div>{isLoading ? <div>Loading...</div> : children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
