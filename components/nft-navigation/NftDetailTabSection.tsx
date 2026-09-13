"use client";

import type { ReactNode } from "react";
import { Suspense, useLayoutEffect, useRef } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function NftDetailTabSection({
  activeFocus,
  navigation,
  children,
  locale,
  persistentContent,
}: {
  readonly activeFocus: string;
  readonly navigation: ReactNode;
  readonly children: ReactNode;
  readonly locale: SupportedLocale;
  readonly persistentContent?: ReactNode;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(activeFocus);

  useLayoutEffect(() => {
    if (previousFocus.current === activeFocus) {
      return;
    }
    previousFocus.current = activeFocus;
    sectionRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [activeFocus]);

  return (
    <div
      ref={sectionRef}
      data-nft-detail-tab-section
      className="tw-min-h-[calc(100dvh-2rem)] tw-scroll-mt-4"
    >
      {navigation}
      <div className="[overflow-anchor:none]">
        {/* Loading a tab must not hide the artwork or the focused tab button. */}
        <Suspense
          fallback={
            <div role="status" className="tw-py-8 tw-text-sm tw-text-iron-400">
              {t(locale, "nftDetail.tabs.loading")}
            </div>
          }
        >
          {children}
        </Suspense>
        {persistentContent}
      </div>
    </div>
  );
}
