import dynamic from "next/dynamic";
import { CommunityMemberOverview } from "../entities/IProfile";
import { SortDirection } from "../entities/ISort";
import { FullPageRequest, Page } from "../helpers/Types";
import {
  getCommonHeaders,
  getCommunityMembers,
} from "../helpers/server.helpers";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import Head from "next/head";
import CommunityMembers from "../components/community/CommunityMembers";
import { useContext } from "react";
import { ReactQueryWrapperContext } from "../components/react-query-wrapper/ReactQueryWrapper";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface CommunityPageProps {
  readonly members: Page<CommunityMemberOverview>;
}

export enum CommunityMembersSortOption {
  DISPLAY = "display",
  LEVEL = "level",
  TDH = "tdh",
  REP = "rep",
  CIC = "cic",
}

export type CommunityMembersQuery = FullPageRequest<CommunityMembersSortOption>;

const INITIAL_PARAMS: CommunityMembersQuery = {
  page: 1,
  page_size: 50,
  sort_direction: SortDirection.DESC,
  sort: CommunityMembersSortOption.LEVEL,
};

export default function CommunityPage({
  pageProps,
}: {
  readonly pageProps: CommunityPageProps;
}) {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Community" },
  ];
  const { initCommunityMembers } = useContext(ReactQueryWrapperContext);
  initCommunityMembers({
    params: INITIAL_PARAMS,
    data: pageProps.members,
  });
  return (
    <>
      <Head>
        <title>Community | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community`}
        />
        <meta property="og:title" content="Community" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950">
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-4 tw-pb-16 lg:tw-pb-20 tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <h1 className="tw-block tw-float-none">Community</h1>
          <CommunityMembers initialParams={INITIAL_PARAMS} />
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
  props: CommunityPageProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    return {
      props: {
        members: await getCommunityMembers({
          headers,
          params: INITIAL_PARAMS,
        }),
      },
    };
  } catch (error) {
    return {
      props: {
        members: {
          count: 0,
          page: 1,
          next: false,
          data: [],
        },
      },
    };
  }
}
