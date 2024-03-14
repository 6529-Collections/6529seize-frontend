import Head from "next/head";

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
import { useContext, useEffect, useRef, useState } from "react";
import { ReactQueryWrapperContext } from "../components/react-query-wrapper/ReactQueryWrapper";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { AnimatePresence, motion } from "framer-motion";
import CommunityCurationFilters from "../components/curation/CommunityCurationFilters";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../store/curationFilterSlice";
import CommunityCurationFiltersSidebarToggleButton from "../components/curation/sidebar/CommunityCurationFiltersSidebarToggleButton";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 50,
  logTypes: [],
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
  activeCurationFilterId: null,
};

export interface CommunityActivityPage {
  readonly logsPage: Page<ProfileActivityLog>;
}

export default function CommunityActivityPage({
  pageProps,
}: {
  readonly pageProps: CommunityActivityPage;
}) {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Community Activity" },
  ];
  const router = useRouter();
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const dispatch = useDispatch();
  const { initCommunityActivityPage } = useContext(ReactQueryWrapperContext);
  initCommunityActivityPage({
    activityLogs: {
      data: pageProps.logsPage,
      params: INITIAL_ACTIVITY_LOGS_PARAMS,
    },
  });

  const [open, setOpen] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const useBreakpoint = createBreakpoint({ MD: 2048, S: 0 });
  const breakpoint = useBreakpoint();

  const [animateContentMarginLeft, setAnimateContentMarginLeft] =
    useState(false);
  useEffect(() => {
    if (breakpoint === "MD" || !open) {
      setAnimateContentMarginLeft(false);
    } else {
      setAnimateContentMarginLeft(true);
    }
  }, [breakpoint, open]);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (router.isReady && !init) {
      const { curation } = router.query as { curation: string | undefined };
      if (curation && curation !== activeCurationFilterId) {
        dispatch(setActiveCurationFilterId(curation));
      }
      setInit(true);
    }
  }, [router.isReady]);

  const elementIsVisibleInViewportPx = (el: HTMLElement | null) => {
    if (!el) {
      return 0;
    }
    const { top, bottom } = el.getBoundingClientRect();
    const { innerHeight } = window;
    const visibleHeight = Math.min(bottom, innerHeight) - Math.max(top, 0);
    return visibleHeight > 0 ? visibleHeight : 0;
  };

  useEffect(() => {
    const handleSidebarTop = () => {
      const headerHeight = headerRef.current
        ? headerRef.current.clientHeight
        : 0;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const newPosition =
        scrollTop <= headerHeight ? headerHeight - scrollTop : 0;
      sidebarRef.current!.style.top = `${newPosition}px`;
      openButtonRef.current!.style.top = `${newPosition}px`;
    };

    const handleSidebarBottom = () => {
      const footerRef = document.getElementById("footer");
      const footerVisibleHeight = elementIsVisibleInViewportPx(footerRef);
      sidebarRef.current!.style.bottom = `${footerVisibleHeight}px`;
    };

    const handleScroll = () => {
      handleSidebarTop();
      handleSidebarBottom();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
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

      <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
        <div ref={headerRef}>
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>
        <motion.div
          initial={false}
          animate={{
            marginLeft: open ? "320px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <CommunityCurationFiltersSidebarToggleButton
            ref={openButtonRef}
            open={open}
            setOpen={setOpen}
          />
        </motion.div>

        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-flex">
            <div
              className="tw-fixed tw-inset-y-0 tw-border-r tw-border-solid tw-border-t-0 tw-border-l-0 tw-border-b-0 tw-border-iron-700 tw-left-0 tw-overflow-x-hidden no-scrollbar"
              ref={sidebarRef}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  initial={{ width: "320px" }}
                  animate={{
                    width: open ? "320px" : "0px",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="tw-bg-iron-950 tw-w-80  ">
                    <CommunityCurationFilters setOpen={setOpen} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="tw-w-full ">
              <motion.div
                initial={{
                  marginLeft: "320px",
                }}
                animate={{
                  marginLeft: animateContentMarginLeft ? "320px" : "0px",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {init && (
                  <ProfileActivityLogs
                    initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
                    withFilters={true}
                  >
                    <h1 className="tw-block tw-float-none tw-whitespace-nowrap">
                      <span className="font-lightest">Community</span> Activity
                    </h1>
                  </ProfileActivityLogs>
                )}
              </motion.div>
            </div>
          </div>
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
      params: convertActivityLogParams({
        params: INITIAL_ACTIVITY_LOGS_PARAMS,
        disableActiveCurationFilter: true,
      }),
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
