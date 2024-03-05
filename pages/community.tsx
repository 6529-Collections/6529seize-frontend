import dynamic from "next/dynamic";
import { FullPageRequest } from "../helpers/Types";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import Head from "next/head";
import CommunityMembers from "../components/community/CommunityMembers";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export enum CommunityMembersSortOption {
  DISPLAY = "display",
  LEVEL = "level",
  TDH = "tdh",
  REP = "rep",
  CIC = "cic",
}

export type CommunityMembersQuery = FullPageRequest<CommunityMembersSortOption>;


export default function CommunityPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Community" },
  ];
  const router = useRouter();
  const goToNerd = () => router.push("/community-nerd");
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
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h1 className="tw-block tw-float-none">Community</h1>
            <button
              type="button"
              className="tw-relative tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
              onClick={goToNerd}
            >
              <span>Nerd view</span>
              <svg
                className="-tw-mr-1.5 tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <CommunityMembers />
        </div>
      </main>
    </>
  );
}
