"use client";

import { useUserPageTabIndicator } from "@/components/user/layout/useUserPageTabIndicator";
import type { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { UNDERLINE_TAB_INDICATOR_CLASSES } from "@/components/common/underlineTabStyles";
import type { LabNFT } from "@/entities/INFT";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useEffect, useRef } from "react";
import {
  getMemeLabDetailTabLabel,
  MEME_LAB_TABS,
  MemeLabPageTabButton,
} from "./MemeLabPage.utils";

export function MemeLabPageTabs({
  nft,
  activeTab,
  locale,
  onSelectTab,
}: {
  readonly nft: Pick<LabNFT, "id" | "contract">;
  readonly activeTab: MEME_FOCUS;
  readonly locale: SupportedLocale;
  readonly onSelectTab: (tab: MEME_FOCUS) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { activeIndicator, updateActiveIndicator } =
    useUserPageTabIndicator(contentRef);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    updateActiveIndicator();
    window.addEventListener("resize", updateActiveIndicator);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateActiveIndicator);
    resizeObserver?.observe(content);

    return () => {
      window.removeEventListener("resize", updateActiveIndicator);
      resizeObserver?.disconnect();
    };
  }, [updateActiveIndicator]);

  useEffect(() => {
    let secondFrameId: number | undefined;
    const firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(updateActiveIndicator);
    });

    return () => {
      cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== undefined) {
        cancelAnimationFrame(secondFrameId);
      }
    };
  }, [activeTab, updateActiveIndicator]);

  return (
    <nav
      aria-label={t(locale, "memeLab.detail.sections.tabs")}
      className="tw-relative tw-mb-8 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 md:tw-w-full md:tw-border-white/10"
    >
      <div className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden">
        <div
          ref={contentRef}
          className="tw-relative -tw-mb-px tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4"
        >
          {MEME_LAB_TABS.map((tab) => (
            <MemeLabPageTabButton
              key={`${nft.id}-${nft.contract}-${tab.focus}-tab`}
              title={getMemeLabDetailTabLabel(tab.focus, locale)}
              isActive={activeTab === tab.focus}
              onClick={() => onSelectTab(tab.focus)}
            />
          ))}
          <span
            aria-hidden="true"
            className={UNDERLINE_TAB_INDICATOR_CLASSES}
            style={{
              opacity: activeIndicator.visible ? 1 : 0,
              transform: `translate3d(${activeIndicator.left}px, 0, 0) scaleX(${activeIndicator.width})`,
            }}
          />
        </div>
      </div>
    </nav>
  );
}
