"use client";

import { useId, useRef } from "react";
import { useWaveSidebarPreference } from "@/hooks/useWaveSidebarPreference";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ActiveWaveVoteRow } from "@/components/waves/discovery/ActiveWaveVoteRow";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  HighlyRatedWavesToggle,
  type HighlyRatedWavePreviewItem,
} from "./HighlyRatedWavesToggle";

const ACTIVE_VOTES_TAB = "active-votes";
type DiscoveryTab = typeof ACTIVE_VOTES_TAB | "recommendations";
export function SidebarDiscovery({
  previewItems,
  isTouchPreview,
}: {
  readonly previewItems: readonly HighlyRatedWavePreviewItem[];
  readonly isTouchPreview: boolean;
}) {
  const locale = useBrowserLocale();
  const panelId = useId();
  const recommendationsTabRef = useRef<HTMLButtonElement>(null);
  const { activeWave } = useMyStream();
  const votes = useActiveWaveVotes(2);
  const count = votes.data?.pages[0]?.count;
  const isEmpty = !votes.isPending && !votes.isError && count === 0;
  const [savedChoice, setChoice] =
    useWaveSidebarPreference("wave-discovery-tab");
  const [collapsePreference, setCollapsePreference] = useWaveSidebarPreference(
    "wave-discovery-collapsed"
  );
  const collapsed = collapsePreference === "true";
  const defaultTab = count === 0 ? "recommendations" : ACTIVE_VOTES_TAB;
  const selected =
    savedChoice === ACTIVE_VOTES_TAB || savedChoice === "recommendations"
      ? savedChoice
      : defaultTab;
  const select = (tab: DiscoveryTab) => {
    setChoice(tab);
    setCollapsePreference("false");
  };
  return (
    <section
      aria-label={t(locale, "waves.discovery.label")}
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-2"
    >
      <div className="tw-flex tw-items-center tw-gap-1 tw-px-3">
        <fieldset
          className="tw-m-0 tw-flex tw-min-w-0 tw-flex-1 tw-border-0 tw-p-0"
          aria-label={t(locale, "waves.discovery.label")}
        >
          {([ACTIVE_VOTES_TAB, "recommendations"] as const).map((tab) => (
            <button
              key={tab}
              ref={
                tab === "recommendations" ? recommendationsTabRef : undefined
              }
              type="button"
              aria-pressed={selected === tab}
              aria-controls={panelId}
              onClick={() => select(tab)}
              className={`tw-min-h-11 tw-flex-1 tw-rounded-md tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-2 tw-text-xs tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${selected === tab ? "tw-border-primary-400 tw-text-white" : "tw-border-transparent tw-text-iron-400"}`}
            >
              {t(
                locale,
                tab === ACTIVE_VOTES_TAB
                  ? "waves.discovery.activeVotes"
                  : "waves.discovery.recommendations"
              )}
              {tab === ACTIVE_VOTES_TAB && count !== undefined && (
                <span className="tw-ml-1 tw-inline-block tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-text-primary-300">
                  {formatInteger(locale, count)}
                </span>
              )}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={panelId}
          aria-label={t(
            locale,
            collapsed ? "waves.discovery.expand" : "waves.discovery.collapse"
          )}
          onClick={() => {
            setCollapsePreference(String(!collapsed));
          }}
          className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {collapsed ? (
            <ChevronDownIcon className="tw-size-4" />
          ) : (
            <ChevronUpIcon className="tw-size-4" />
          )}
        </button>
      </div>
      <div id={panelId} hidden={collapsed} className="tw-px-3 tw-pt-2">
        <p className="tw-mb-2 tw-px-2 tw-text-xs tw-leading-relaxed tw-text-iron-400">
          {t(
            locale,
            selected === ACTIVE_VOTES_TAB
              ? "waves.discovery.activeVotesDescription"
              : "waves.discovery.recommendationsDescription"
          )}
        </p>
        {selected === ACTIVE_VOTES_TAB ? (
          <>
            {votes.isPending && (
              <output className="tw-block tw-p-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.discovery.loading")}
              </output>
            )}
            {votes.isError && (
              <p role="alert" className="tw-p-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.discovery.error")}{" "}
                <button
                  type="button"
                  onClick={() => void votes.refetch()}
                  className="tw-border-0 tw-bg-transparent tw-text-primary-300"
                >
                  {t(locale, "waves.discovery.retry")}
                </button>
              </p>
            )}
            {isEmpty && (
              <output className="tw-mb-0 tw-block tw-px-2 tw-py-3 tw-text-sm tw-text-iron-300">
                {t(locale, "waves.discovery.emptyVotes")}
              </output>
            )}
            {votes.data?.pages[0]?.data.map((vote) => (
              <ActiveWaveVoteRow
                key={vote.wave.id}
                vote={vote}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  )
                    return;
                  event.preventDefault();
                  activeWave.set(vote.wave.id, { isDirectMessage: false });
                }}
              />
            ))}
            {isEmpty ? (
              <button
                type="button"
                onClick={() => {
                  select("recommendations");
                  recommendationsTabRef.current?.focus();
                }}
                className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-xs tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "waves.discovery.browseRecommendations")}
              </button>
            ) : (
              <Link
                href="/discover?view=active-votes"
                className="tw-inline-flex tw-min-h-9 tw-items-center tw-px-2 tw-text-xs tw-text-primary-300 tw-no-underline"
              >
                {t(locale, "waves.discovery.viewVotes")}
              </Link>
            )}
          </>
        ) : (
          <>
            {previewItems.length > 0 ? (
              <HighlyRatedWavesToggle
                isTouchPreview={isTouchPreview}
                paddingClassName="tw-px-2"
                previewItems={[...previewItems]}
              />
            ) : (
              <p className="tw-p-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.discovery.emptyRecommendations")}
              </p>
            )}
            <Link
              href="/discover?view=recommendations&sort=QUALITY"
              className="tw-inline-flex tw-min-h-9 tw-items-center tw-px-2 tw-text-xs tw-text-primary-300 tw-no-underline"
            >
              {t(locale, "waves.discovery.viewRecommendations")}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
