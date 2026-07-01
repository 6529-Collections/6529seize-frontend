"use client";

import styles from "./NextGen.module.scss";

import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NextgenView } from "@/types/enums";
import Image from "next/image";
import { useSyncExternalStore } from "react";

const MOBILE_HEADER_MAX_WIDTH = 750;
const COMPACT_HEADER_MAX_WIDTH = 575;
const STACKED_HEADER_MAX_WIDTH = 1199;

function subscribeToHeaderResize(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function getHeaderViewportWidth() {
  return window.innerWidth;
}

function getServerHeaderViewportWidth() {
  return STACKED_HEADER_MAX_WIDTH + 1;
}

export default function NextGenNavigationHeader(
  props: Readonly<{
    view?: NextgenView | undefined;
    setView?: ((view: NextgenView | undefined) => void) | undefined;
  }>
) {
  const headerViewportWidth = useSyncExternalStore(
    subscribeToHeaderResize,
    getHeaderViewportWidth,
    getServerHeaderViewportWidth
  );
  const isMobile = headerViewportWidth <= MOBILE_HEADER_MAX_WIDTH;
  const isCompactHeader = headerViewportWidth <= COMPACT_HEADER_MAX_WIDTH;
  const isStackedHeader = headerViewportWidth <= STACKED_HEADER_MAX_WIDTH;

  function printView(v: NextgenView | undefined) {
    let styles: any = { borderBottom: "1px solid white", cursor: "default" };
    if (!props.setView || (!v && props.view) || (v && v !== props.view)) {
      styles = {};
    }
    const viewHeader = (
      <h5 className={`mb-0 pb-2 font-color unselectable`} style={styles}>
        <b>{v ?? "Featured"}</b>
      </h5>
    );
    if (props.view == v && props.setView) {
      return viewHeader;
    }
    return (
      <button
        className="btn-link decoration-none"
        onClick={() => {
          if (props.setView) {
            props.setView(v);
          } else {
            let href = "/nextgen";
            if (v) {
              href += `/${v.toLowerCase()}`;
            }
            window.location.href = href;
          }
        }}
      >
        {viewHeader}
      </button>
    );
  }

  let mobileLogoWidth = "250px";
  if (isCompactHeader) {
    mobileLogoWidth = "140px";
  } else if (isMobile) {
    mobileLogoWidth = "170px";
  }

  let mobileLogoMaxWidth = "85vw";
  if (isCompactHeader) {
    mobileLogoMaxWidth = "38vw";
  } else if (isMobile) {
    mobileLogoMaxWidth = "48vw";
  }

  let headerControlsClassName = "gap-3 flex-nowrap";
  if (isStackedHeader) {
    let stackedJustifyClassName = "justify-content-start";
    if (isCompactHeader) {
      stackedJustifyClassName = "justify-content-between";
    }
    headerControlsClassName = `gap-2 flex-nowrap ${stackedJustifyClassName} w-100`;
  }

  let headerPaddingTop = "0";
  if (isStackedHeader) {
    headerPaddingTop = "10px";
    if (isMobile) {
      headerPaddingTop = "20px";
    }
  }

  return (
    <>
      <div
        className={`tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] ${styles["navigationHeader"]} ${
          isStackedHeader ? `flex-column gap-2` : `justify-content-between`
        }`}
        style={{
          height: isStackedHeader ? "auto" : "90px",
          paddingTop: headerPaddingTop,
        }}
      >
        <div className={`d-flex align-items-center ${headerControlsClassName}`}>
          <span className="d-xl-none flex-shrink-1 overflow-hidden">
            <CollectionsDropdown
              activePage="nextgen"
              variant="brand"
              triggerContent={
                <Image
                  unoptimized
                  width="0"
                  height="0"
                  style={{
                    width: mobileLogoWidth,
                    maxWidth: mobileLogoMaxWidth,
                    height: "auto",
                  }}
                  src="/nextgen-logo.png"
                  alt="nextgen"
                />
              }
            />
          </span>
          <Image
            unoptimized
            priority
            width="0"
            height="0"
            className="cursor-pointer d-none d-xl-block"
            style={{
              width: "250px",
              maxWidth: "85vw",
              height: "auto",
            }}
            src="/nextgen-logo.png"
            alt="nextgen"
            onClick={() => {
              if (props.setView) {
                props.setView(undefined);
              } else {
                window.location.href = "/nextgen";
              }
            }}
          />
          <span className="flex-shrink-0">
            <LFGButton contract={"nextgen"} />
          </span>
        </div>
        <div
          className={`d-flex align-items-center ${
            isStackedHeader
              ? "w-100 justify-content-center pt-3 pb-3"
              : "justify-content-end"
          }`}
        >
          <span className="d-flex justify-content-center justify-content-md-end gap-3 gap-md-4">
            {printView(undefined)}
            {printView(NextgenView.COLLECTIONS)}
            {printView(NextgenView.ARTISTS)}
            {printView(NextgenView.ABOUT)}
          </span>
        </div>
      </div>

      <hr className={styles["navigationHeaderHr"]} />
    </>
  );
}
