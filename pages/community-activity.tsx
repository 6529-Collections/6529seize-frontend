import Head from "next/head";

import { Inter } from "next/font/google";
import {
  getCommonHeaders,
  getUserProfileActivityLogs,
} from "../helpers/server.helpers";
import { Page } from "../helpers/Types";
import { ProfileActivityLog } from "../entities/IProfile";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import ProfileActivityLogs, {
  ActivityLogParams,
  convertActivityLogParams,
} from "../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../components/utils/CommonFilterTargetSelect";
import { useContext } from "react";
import { ReactQueryWrapperContext } from "../components/react-query-wrapper/ReactQueryWrapper";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 50,
  logTypes: [],
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
};

export interface CommunityActivityPage {
  readonly logsPage: Page<ProfileActivityLog>;
}

export default function CommunityActivityPage({
  pageProps,
}: {
  readonly pageProps: CommunityActivityPage;
}) {
  // const { initCommunityActivityPage } = useContext(ReactQueryWrapperContext);
  // initCommunityActivityPage({
  //   activityLogs: {
  //     data: pageProps.logsPage,
  //     params: INITIAL_ACTIVITY_LOGS_PARAMS,
  //   },
  // });
  return (
    <>
      <Head>
        <title>Profiles Activity | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Profiles Activity | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/profiles-activity`}
        />
        <meta property="og:title" content="Profiles Activity" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950">
        <Header />
        <div
          className={`tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20 tw-relative tw-px-6 min-[1100px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] min-[1800px]:tw-max-w-[1750px] min-[2000px]:tw-max-w-[1950px] tw-mx-auto ${inter.className}`}
        >
          <div className="tw-mt-6">
            <h1 className="tw-block tw-uppercase tw-text-iron-50 tw-float-none tw-pb-0 tw-mb-0">
              Community Activity
            </h1>
          </div>
          <ProfileActivityLogs
            initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
            withFilters={true}
          />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: CommunityActivityPage;
}> {
  try {
    const headers = getCommonHeaders(req);
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams(INITIAL_ACTIVITY_LOGS_PARAMS),
    });
    return {
      props: {
        logsPage,
      },
    };
  } catch (e: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }
}
