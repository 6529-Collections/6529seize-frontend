import { ReactNode, useEffect, useRef, useState } from "react";
import Breadcrumb, { Crumb } from "../../breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import GroupsSidebarToggleButton from "../../groups/sidebar/GroupsSidebarToggleButton";
import GroupsSidebar from "../../groups/sidebar/GroupsSidebar";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveGroupId,
  setActiveGroupId,
} from "../../../store/groupSlice";

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

  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();

  const headerRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (breakpoint === "S") {
      setOpen(false);
    }
  }, [breakpoint]);

  const getAnimateContentMarginLeft = () => {
    if (["XXL", "S"].includes(breakpoint) || !open) {
      return false;
    }
    return true;
  };

  const [animateContentMarginLeft, setAnimateContentMarginLeft] =
    useState(false);
  const [init, setInit] = useState(false);

  useEffect(
    () => setAnimateContentMarginLeft(getAnimateContentMarginLeft()),
    [breakpoint, open]
  );

  useEffect(() => {
    if (router.isReady && !init) {
      const { group } = router.query as { group: string | undefined };
      if (group && group !== activeGroupId) {
        dispatch(setActiveGroupId(group));
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
      <div
        className={`tw-transition-all tw-duration-300 tw-ease-out ${
          !open ? "tw-ml-0" : "tw-ml-[320px]"
        }`}
      >
        <GroupsSidebarToggleButton
          ref={openButtonRef}
          open={open}
          setOpen={setOpen}
        />
      </div>
      <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-flex">
          <div
            className={`tw-fixed tw-z-50 tw-inset-y-0 tw-h-full tw-left-0 tw-overflow-x-hidden no-scrollbar tw-transform tw-transition tw-duration-300 tw-ease-out ${
              !open ? "-tw-translate-x-full" : ""
            }`}
            ref={sidebarRef}
          >
            <div className="tw-bg-iron-950 tw-min-h-screen  tw-w-80 tw-border-r tw-border-solid tw-border-t-0 tw-border-l-0 tw-border-b-0 tw-border-iron-700">
              <GroupsSidebar />
            </div>
          </div>
          <div className="tw-w-full">
            <div
              className={` tw-transform tw-transition-all tw-duration-300 tw-ease-out ${
                animateContentMarginLeft ? "tw-ml-[320px]" : " tw-ml-0"
              }`}
            >
              {init && children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
