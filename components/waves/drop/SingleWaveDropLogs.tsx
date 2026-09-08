"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { t } from "@/i18n/messages";
import { ClockIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "framer-motion";
import React, { useId, useState } from "react";
import { SingleWaveDropEmptyState } from "./SingleWaveDropEmptyState";
import { SingleWaveDropLog } from "./SingleWaveDropLog";

interface SingleWaveDropLogsProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropLogs: React.FC<SingleWaveDropLogsProps> = ({
  drop,
}) => {
  const locale = useBrowserLocale();
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const panelId = useId();
  const buttonId = `${panelId}-toggle`;

  const { connectedProfile } = useAuth();
  const { logs, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveActivityLogs({
      waveId: drop.wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: drop.id,
      logTypes: ["DROP_VOTE_EDIT"],
      enabled: isActivityOpen,
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <LazyMotion features={domAnimation}>
      <div>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isActivityOpen}
          aria-controls={panelId}
          onClick={() => setIsActivityOpen(!isActivityOpen)}
          className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-border-0 tw-px-4 tw-py-4 tw-text-left tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-900 ${
            isActivityOpen ? "tw-bg-iron-800" : "tw-bg-iron-950"
          }`}
        >
          <span
            className={`tw-text-sm tw-font-medium ${isActivityOpen ? "tw-text-iron-300" : "tw-text-iron-400"}`}
          >
            Activity log
          </span>
          <m.div
            animate={{ rotate: isActivityOpen ? 180 : 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          >
            <ChevronDownIcon
              className={`tw-h-4 tw-w-4 tw-flex-shrink-0 ${isActivityOpen ? "tw-text-iron-400" : "tw-text-iron-600"}`}
            />
          </m.div>
        </button>

        <AnimatePresence>
          {isActivityOpen && (
            <m.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              className="tw-overflow-hidden"
            >
              <div className="tw-max-h-[19.75rem] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
                {logs.length > 0 || isLoading ? (
                  <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
                    {logs.map((log) => (
                      <SingleWaveDropLog
                        key={log.id}
                        log={log}
                        creditType={drop.wave.voting_credit_type}
                      />
                    ))}
                  </div>
                ) : (
                  <SingleWaveDropEmptyState
                    icon={<ClockIcon className="tw-size-6" />}
                    title={t(locale, "waves.voteInsights.emptyActivityTitle")}
                    description={t(
                      locale,
                      "waves.voteInsights.emptyActivityDescription"
                    )}
                  />
                )}

                {isFetchingNextPage && (
                  <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
                    <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400 motion-reduce:tw-animate-none"></div>
                  </div>
                )}
                <div ref={intersectionElementRef}></div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
