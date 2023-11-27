import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import { numberWithCommas } from "../../../helpers/Helpers";
import styles from "../../../styles/Home.module.scss";
import UserPageHeader from "../user-page-header/UserPageHeader";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";
import UserPageTabs from "./UserPageTabs";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";

const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
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
  const pagenameFull = `${props.title} | 6529 SEIZE`;

  const descriptionArray = [];
  if (props.profile.consolidation.tdh && props.profile.consolidation.tdh > 0) {
    descriptionArray.push(
      `TDH: ${numberWithCommas(props.profile.consolidation.tdh)}`
    );
  }
  if (props.consolidatedTDH?.balance && props.consolidatedTDH?.balance > 0) {
    descriptionArray.push(
      `Cards: ${numberWithCommas(props.consolidatedTDH?.balance)}`
    );
  }
  descriptionArray.push("6529 SEIZE");

  const mainAddress =
    props.profile.profile?.primary_wallet ?? user.toLowerCase();

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
          content={props.profile.profile?.pfp_url ?? DEFAULT_IMAGE}
        />
        <meta
          property="og:description"
          content={descriptionArray.join(" | ")}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <div className="tw-bg-neutral-950 tw-min-h-screen">
          <UserPageHeader
         //  profile={props.profile}
            mainAddress={mainAddress}
            consolidatedTDH={props.consolidatedTDH}
            activeAddress={activeAddress}
            onActiveAddress={onActiveAddress}
            user={user}
          />
          <UserPageTabs />
          {isLoading ? <div>Loading...</div> : children}
        </div>
      </main>
    </>
  );
}
