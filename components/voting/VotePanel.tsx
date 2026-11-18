"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SingleWaveDropVoteMode } from "@/components/waves/drop/SingleWaveDropVote.types";
import type { VoteControlVariant } from "./VoteControl.styles";

interface VotePanelProps {
  readonly children: ReactNode;
  readonly mode: SingleWaveDropVoteMode;
  readonly modeControl?: ReactNode;
  readonly variant?: VoteControlVariant | undefined;
  readonly hidden?: boolean | undefined;
}

export function VotePanel({
  children,
  mode,
  modeControl,
  variant = "default",
  hidden,
}: VotePanelProps) {
  const locale = useBrowserLocale();
  const mini = variant === "compact";
  return (
    <div
      role="group"
      aria-label={t(locale, "waves.vote.controlsLegend")}
      hidden={hidden}
      data-vote-mode={mode}
      className={clsx(
        "is-vote-panel tw-group/inline-vote tw-min-w-0 tw-space-y-4 tw-@container/vote [&[hidden]]:tw-hidden",
        mini &&
          "is-mini tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3"
      )}
    >
      <div
        data-vote-panel-header
        className="tw-flex tw-min-h-[30px] tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2"
      >
        <span
          className={clsx(
            "tw-font-medium tw-text-iron-400",
            mini ? "tw-text-xs" : "tw-text-sm"
          )}
        >
          {t(locale, "competitions.voteValue")}
        </span>
        {modeControl}
      </div>
      {children}
    </div>
  );
}
