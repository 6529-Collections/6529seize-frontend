import { ReactNode, useEffect, useRef, useState } from "react";
import Breadcrumb, { Crumb } from "../../breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import { AnimatePresence, motion } from "framer-motion";
import CommunityCurationFiltersSidebarToggleButton from "../../curation/sidebar/CommunityCurationFiltersSidebarToggleButton";
import CommunityCurationFilters from "../../curation/CommunityCurationFilters";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../../../store/curationFilterSlice";

const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function SidebarLayout({
  breadcrumbs,
  children,
}: {
  readonly breadcrumbs: Crumb[];
  readonly children: ReactNode;
}) {
  const useBreakpoint = createBreakpoint({ XXL: 2048, MD: 768, S: 0 });
  const breakpoint = useBreakpoint();
  const router = useRouter();

  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const dispatch = useDispatch();

  const headerRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(true);
  const [animateContentMarginLeft, setAnimateContentMarginLeft] =
    useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (["XXL", "S"].includes(breakpoint) || !open) {
      setAnimateContentMarginLeft(false);
    } else {
      setAnimateContentMarginLeft(true);
    }
  }, [breakpoint, open]);

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
            className="tw-fixed tw-z-50 tw-inset-y-0 tw-border-r tw-border-solid tw-border-t-0 tw-border-l-0 tw-border-b-0 tw-border-iron-700 tw-left-0 tw-overflow-x-hidden no-scrollbar"
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

          <div className="tw-w-full">
            <motion.div
              initial={{
                marginLeft: "320px",
              }}
              animate={{
                marginLeft: animateContentMarginLeft ? "320px" : "0px",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {init && children}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
