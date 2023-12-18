import Head from "next/head";

import { Inter } from "next/font/google";
import { getCommonHeaders, getProfileLogs } from "../helpers/server.helpers";
import { Page } from "../helpers/Types";
import { ProfileActivityLog } from "../entities/IProfile";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import ProfileActivityLogs from "../components/profile-activity/ProfileActivityLogs";

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

const PAGE_SIZE = 50;

export interface CommunityActivityPage {
  readonly logsPage: Page<ProfileActivityLog>;
}

export default function CommunityActivityPage({
  pageProps,
}: {
  readonly pageProps: CommunityActivityPage;
}) {
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

      <main className="tw-min-h-screen">
        <Header />
        <div
          className={`tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20 ${inter.className}`}
        >
          <ProfileActivityLogs
            initialLogs={pageProps.logsPage}
            pageSize={PAGE_SIZE}
            user={null}
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
    const logsPage = await getProfileLogs({ headers, pageSize: PAGE_SIZE });
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
