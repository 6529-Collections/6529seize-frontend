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
import {
  HighlyRatedWavesToggle,
  type HighlyRatedWavePreviewItem,
} from "./HighlyRatedWavesToggle";

function DiscoverySection({
  label,
  count,
  collapsed,
  onToggle,
  children,
}: {
  readonly label: string;
  readonly count?: number | undefined;
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
      <h3 id={`${id}-heading`} className="tw-m-0 tw-px-4">
        <button
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
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left tw-text-xs tw-font-medium tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <span>{label}</span>
          {count !== undefined && (
            <span
              id={`${id}-count`}
              className="tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-text-primary-300"
            >
              {formatInteger(locale, count)}
            </span>
          )}
          <ChevronRightIcon
            aria-hidden="true"
            className={`tw-ml-auto tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 tw-ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:tw-transition-none ${collapsed ? "" : "tw-rotate-90"}`}
          />
        </button>
      </h3>
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
}: {
  readonly previewItems: readonly HighlyRatedWavePreviewItem[];
  readonly isTouchPreview: boolean;
}) {
  const locale = useBrowserLocale();
  const votes = useActiveWaveVotes();
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
      aria-label={t(locale, "waves.discovery.label")}
    >
      <DiscoverySection
        label={t(locale, "waves.discovery.activeVotes")}
        count={votes.data?.pages[0]?.count}
        collapsed={activeCollapsed}
        onToggle={() => setActivePreference(String(!activeCollapsed))}
      >
        <p className="tw-m-0 tw-mb-2 tw-text-xs tw-leading-4 tw-text-iron-400">
          {t(locale, "waves.discovery.activeVotesDescription")}
        </p>
        <SidebarActiveVotes votes={votes} collapsed={activeCollapsed} />
        <Link
          href="/discover?view=active-votes"
          className="tw-mt-2 tw-inline-flex tw-min-h-8 tw-items-center tw-text-xs tw-text-primary-300 tw-no-underline"
        >
          {t(locale, "waves.discovery.viewVotes")}
        </Link>
      </DiscoverySection>
      <DiscoverySection
        label={t(locale, "waves.discovery.recommendations")}
        collapsed={recommendationsCollapsed}
        onToggle={() =>
          setRecommendationsPreference(String(!recommendationsCollapsed))
        }
      >
        <p className="tw-m-0 tw-mb-2 tw-text-xs tw-leading-4 tw-text-iron-400">
          {t(
            locale,
            canUseCollections
              ? "waves.discovery.recommendationsDescription"
              : "waves.discovery.publicRecommendationsDescription"
          )}
        </p>
        {previewItems.length > 0 ? (
          <HighlyRatedWavesToggle
            isTouchPreview={isTouchPreview}
            paddingClassName="tw-px-0"
            previewItems={[...previewItems]}
          />
        ) : (
          <p className="tw-m-0 tw-py-2 tw-text-xs tw-text-iron-400">
            {t(locale, "waves.discovery.emptyRecommendations")}
          </p>
        )}
        <Link
          href="/discover?view=recommendations&sort=QUALITY"
          className="tw-mt-2 tw-inline-flex tw-min-h-8 tw-items-center tw-text-xs tw-text-primary-300 tw-no-underline"
        >
          {t(locale, "waves.discovery.viewRecommendations")}
        </Link>
      </DiscoverySection>
    </section>
  );
}
