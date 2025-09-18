"use client";

import React, { useState, useCallback, useEffect } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import HomePageTabs from "./HomePageTabs";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import Image from "next/image";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";

interface HomePageProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
}

export default function HomePage({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
}: HomePageProps) {
  const { isApp } = useDeviceInfo();
  const { isAuthenticated } = useSeizeConnectContext();
  const [activeTab, setActiveTab] = useState<"feed" | "latest">(
    isAuthenticated ? "feed" : "latest"
  );
  const { registerRef } = useLayout();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Drop modal logic
  const dropId = searchParams?.get("drop") ?? undefined;

  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  const onDropClose = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || "/";
    router.replace(newUrl, { scroll: false });
  };

  const isDropOpen = !!dropId && !!drop;

  // Update active tab when authentication state changes
  useEffect(() => {
    setActiveTab(isAuthenticated ? "feed" : "latest");
  }, [isAuthenticated]);

  // Handle escape key for drop modal
  useEffect(() => {
    if (!isDropOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDropClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isDropOpen, onDropClose]);

  // Callback ref for registration with LayoutContext
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRef("tabs", element);
    },
    [registerRef]
  );

  // For mobile app, return null to let mobile layout handle routing
  if (isApp) {
    return null;
  }

  return (
    <div className="tw-h-full tw-min-h-screen">
      {/* Drop Modal - positioned to respect sidebar */}
      {isDropOpen && (
        <div
          className="tw-fixed tw-inset-0 tw-z-[49] tw-bg-black"
          style={{
            left: "var(--left-rail)", // Start after sidebar
            transition: "none",
          }}
        >
          <BrainDesktopDrop
            drop={{
              type: DropSize.FULL,
              ...drop,
              stableKey: drop.id,
              stableHash: drop.id,
            }}
            onClose={onDropClose}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <HomePageTabs
        ref={setTabsRef}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="tw-h-full">
        {activeTab === "feed" ? (
          <div className="tw-min-h-full tw-bg-black tw-overflow-hidden tailwind-scope tw-px-2 xl:tw-px-8">
            {isAuthenticated ? (
              <HomeFeed />
            ) : (
              <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-px-6 tw-min-h-[calc(100vh-56px)]">
                <Image
                  unoptimized
                  priority
                  loading="eager"
                  src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
                  alt="Brain"
                  width={304}
                  height={450}
                  className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
                />
                <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
                  <h1 className="tw-text-xl tw-font-bold">
                    This content is only available to connected wallets.
                  </h1>
                  <p className="tw-text-base tw-text-gray-400">
                    Connect your wallet to continue.
                  </p>
                  <HeaderUserConnect />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Home
            featuredNft={featuredNft}
            featuredNextgen={featuredNextgen}
            initialActivityData={initialActivityData}
            initialTokens={initialTokens}
          />
        )}
      </div>
    </div>
  );
}
