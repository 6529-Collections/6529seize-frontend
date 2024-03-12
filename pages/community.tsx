import dynamic from "next/dynamic";
import { FullPageRequest } from "../helpers/Types";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import Head from "next/head";
import CommunityMembers from "../components/community/CommunityMembers";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import SlideOver from "../components/utils/sidebar/SlideOver";
import { useEffect, useState } from "react";
import CommunityCurationFilters from "../components/curation/CommunityCurationFilters";

import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../store/curationFilterSlice";
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

export interface CommunityMembersQuery
  extends FullPageRequest<CommunityMembersSortOption> {
  curation_criteria_id?: string;
}

export default function CommunityPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Community" },
  ];

  const [init, setInit] = useState(false);
  const router = useRouter();

  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (router.isReady && !init) {
      const { curation } = router.query as { curation: string | undefined };
      if (curation && curation !== activeCurationFilterId) {
        dispatch(setActiveCurationFilterId(curation));
      }
      setInit(true);
    }
  }, [router.isReady]);

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
        <div className="tw-sticky tw-top-0">
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-flex">
            <div
              className={`${
                open
                  ? "tw-w-[20rem] tw-col-span-2 tw-fixed tw-inset-y-0 tw-bg-iron-800 tw-top-[150px] tw-left-0 "
                  : "tw-w-0 tw-h-0 tw-invisible -tw-translate-x-full"
              } tw-transform tw-transition tw-duration-300 tw-ease-out`}
            >
              <SlideOver>
                <CommunityCurationFilters setOpen={setOpen} />
              </SlideOver>
            </div>
            <div className="tw-w-full">
              <button onClick={() => setOpen(!open)}>nupp</button>
              <div
                className={` ${
                  open ? "tw-ml-64 2xl:tw-ml-0" : "tw-w-full"
                } tw-col-span-6 tw-transition-all tw-duration-500 tw-ease-in-out`}
              >
                {init && <CommunityMembers />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
