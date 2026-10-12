"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useWaveSidebarPreference } from "@/hooks/useWaveSidebarPreference";
import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { SidebarActiveVotes } from "./SidebarActiveVotes";
import { useWaveFeatureUsage } from "@/hooks/useWaveFeatureUsage";
import { waveFeatureAttributes } from "@/services/analytics/waveFeatureUsage";
import {
  HighlyRatedWavesToggle,
  type HighlyRatedWavePreviewItem,
} from "./HighlyRatedWavesToggle";

function DiscoverySection({
  featureValue,
  label,
  count,
  viewAllHref,
  viewAllLabel,
  collapsed,
  onToggle,
  children,
}: {
  readonly featureValue: "recommendations" | "active_votes";
  readonly label: string;
  readonly count?: number | undefined;
  readonly viewAllHref: string;
  readonly viewAllLabel: string;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) {
  const id = useId();
  const locale = useBrowserLocale();
  return (
    <section
      aria-label={label}
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
    >
      <div className="tw-relative tw-mx-4 tw-flex tw-min-h-9 tw-items-center tw-gap-2">
        <h3 id={`${id}-heading`} className="tw-m-0 tw-min-w-0 tw-flex-1">
          <button
            {...waveFeatureAttributes("sidebar_section", featureValue)}
            type="button"
            aria-expanded={!collapsed}
            aria-controls={id}
            aria-describedby={count === undefined ? undefined : `${id}-count`}
            aria-label={t(
              locale,
              collapsed
                ? "waves.discovery.expandSection"
                : "waves.discovery.collapseSection",
              { section: label }
            )}
            onClick={onToggle}
            className="tw-flex tw-min-h-9 tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-xs tw-font-medium tw-text-white before:tw-absolute before:tw-inset-0 before:tw-rounded-lg before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-primary-400"
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                id={`${id}-count`}
                className="tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-primary-300"
              >
                {formatInteger(locale, count)}
              </span>
            )}
          </button>
        </h3>
        <Link
          {...waveFeatureAttributes("sidebar_entry", `${featureValue}_all`)}
          href={viewAllHref}
          aria-label={viewAllLabel}
          className="tw-relative tw-z-10 tw-inline-flex tw-min-h-8 tw-shrink-0 tw-items-center tw-rounded-md tw-text-[11px] tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "waves.discovery.viewAll")}
        </Link>
        <ChevronRightIcon
          aria-hidden="true"
          className={`tw-pointer-events-none tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 tw-ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:tw-transition-none ${collapsed ? "" : "tw-rotate-90"}`}
        />
      </div>
      <div
        id={id}
        aria-hidden={collapsed}
        inert={collapsed}
        className={`tw-grid tw-transition-[grid-template-rows,visibility] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none ${collapsed ? "tw-invisible tw-grid-rows-[0fr]" : "tw-visible tw-grid-rows-[1fr]"}`}
      >
        <div className="tw-min-h-0 tw-overflow-hidden">
          <div className="tw-px-4 tw-pb-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function SidebarDiscovery({
  previewItems,
  isTouchPreview,
  scoreDetailsDisabled = false,
}: {
  readonly previewItems: readonly HighlyRatedWavePreviewItem[];
  readonly isTouchPreview: boolean;
  readonly scoreDetailsDisabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const votes = useActiveWaveVotes();
  const { ref: featureUsageRef } = useWaveFeatureUsage("sidebar");
  const { canUseCollections } = useWaveDiscoveryViewer();
  const [activePreference, setActivePreference] = useWaveSidebarPreference(
    "wave-discovery-active-collapsed",
    "local"
  );
  const [recommendationsPreference, setRecommendationsPreference] =
    useWaveSidebarPreference(
      "wave-discovery-recommendations-collapsed",
      "local"
    );
  const activeCollapsed = activePreference === "true";
  const recommendationsCollapsed = recommendationsPreference === "true";
  return (
    <section
      className="tailwind-scope"
      ref={featureUsageRef}
      aria-label={t(locale, "waves.discovery.label")}
    >
      <DiscoverySection
        label={t(locale, "waves.discovery.recommendations")}
        featureValue="recommendations"
        viewAllHref="/discover?view=recommendations&sort=QUALITY"
        viewAllLabel={t(locale, "waves.discovery.viewRecommendations")}
        collapsed={recommendationsCollapsed}
        onToggle={() =>
          setRecommendationsPreference(String(!recommendationsCollapsed))
        }
      >
        <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-leading-4 tw-text-iron-400">
          {t(
            locale,
            canUseCollections
              ? "waves.discovery.recommendationsDescription"
              : "waves.discovery.publicRecommendationsDescription"
          )}
        </p>
        {previewItems.length > 0 ? (
          <HighlyRatedWavesToggle
            compactTouchPadding
            isTouchPreview={isTouchPreview}
            scoreDetailsDisabled={scoreDetailsDisabled}
            paddingClassName="tw-px-0"
            previewItems={[...previewItems]}
          />
        ) : (
          <p className="tw-m-0 tw-py-2 tw-text-xs tw-text-iron-400">
            {t(locale, "waves.discovery.emptyRecommendations")}
          </p>
        )}
      </DiscoverySection>
      <DiscoverySection
        label={t(locale, "waves.discovery.activeVotes")}
        featureValue="active_votes"
        count={votes.data?.pages[0]?.count}
        viewAllHref="/discover?view=active-votes"
        viewAllLabel={t(locale, "waves.discovery.viewVotes")}
        collapsed={activeCollapsed}
        onToggle={() => setActivePreference(String(!activeCollapsed))}
      >
        <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-leading-4 tw-text-iron-400">
          {t(locale, "waves.discovery.activeVotesDescription")}
        </p>
        <SidebarActiveVotes
          votes={votes}
          collapsed={activeCollapsed}
          scoreDetailsDisabled={scoreDetailsDisabled}
        />
      </DiscoverySection>
    </section>
  );
}
