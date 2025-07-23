"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import GroupsSidebarToggle from "../../groups/sidebar/GroupsSidebarToggle";
import GroupsSidebar from "../../groups/sidebar/GroupsSidebar";
import { createBreakpoint } from "react-use";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveGroupId,
  setActiveGroupId,
} from "../../../store/groupSlice";
import { useHeaderContext } from "../../../contexts/HeaderContext";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import SidebarLayoutApp from "./SidebarLayoutApp";

export default function SidebarLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const useBreakpoint = createBreakpoint({ XXL: 2048, MD: 768, S: 0 });
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();

  const { headerRef } = useHeaderContext();
  const { isApp } = useDeviceInfo();
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
    if (!init) {
      const group = searchParams?.get("group");
      if (group && group !== activeGroupId) {
        dispatch(setActiveGroupId(group));
      }
      setInit(true);
    }
  }, []);

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
    if (isApp) return; // Skip DOM manipulation in app mode

    const handleSidebarTop = () => {
      const headerHeight = headerRef.current
        ? headerRef.current.clientHeight
        : 0;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const newPosition =
        scrollTop <= headerHeight ? headerHeight - scrollTop : 0;
      if (sidebarRef.current) sidebarRef.current.style.top = `${newPosition}px`;
      if (openButtonRef.current)
        openButtonRef.current.style.top = `${newPosition}px`;
    };

    const handleSidebarBottom = () => {
      const footerRef = document.getElementById("footer");
      const footerVisibleHeight = elementIsVisibleInViewportPx(footerRef);
      if (sidebarRef.current)
        sidebarRef.current.style.bottom = `${footerVisibleHeight}px`;
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
  }, [isApp]);

  if (isApp) {
    return <SidebarLayoutApp>{children}</SidebarLayoutApp>;
  }

  return (
    <main className="tailwind-scope tw-bg-iron-950 tw-overflow-x-hidden">
      <div
        className={`tw-transition-all tw-duration-300 tw-ease-out ${
          !open ? "tw-ml-0" : "tw-ml-[320px]"
        }`}>
        <GroupsSidebarToggle
          ref={openButtonRef}
          open={open}
          setOpen={setOpen}
        />
      </div>
      <div className="tailwind-scope tw-bg-iron-950 tw-min-h-dvh tw-mt-6 lg:tw-mt-8 tw-pb-6 lg:tw-pb-8 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="tw-flex">
          <div
            className={`tw-fixed tw-z-40 tw-inset-y-0 tw-h-full tw-left-0 tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500  tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transform tw-transition tw-duration-300 tw-ease-out ${
              !open ? "-tw-translate-x-full" : ""
            }`}
            ref={sidebarRef}>
            <div className="tw-bg-iron-950 tw-w-80 tw-border-r tw-border-solid tw-border-t-0 tw-border-l-0 tw-border-b-0 tw-border-iron-700">
              <GroupsSidebar />
            </div>
          </div>
          <div className="tw-w-full">
            <div
              className={` tw-transform tw-transition-all tw-duration-300 tw-ease-out ${
                animateContentMarginLeft ? "tw-ml-[320px]" : " tw-ml-0"
              }`}>
              {init && children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
