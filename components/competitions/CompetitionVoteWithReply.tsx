"use client";

import { useId, useState, type ComponentProps } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";
import { useSingleWaveDropVoteRationale } from "@/components/waves/drop/useSingleWaveDropVoteRationale";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CompetitionVoteForm,
  useCompetitionVoteBudget,
} from "./CompetitionVote";

export default function CompetitionVoteWithReply({
  drop,
  ...props
}: ComponentProps<typeof CompetitionVoteForm> & { readonly drop: ApiDrop }) {
  const locale = useBrowserLocale();
  const fieldId = useId();
  const descriptionId = useId();
  const publicReplyDescriptionId = useId();
  const credit = useCompetitionVoteBudget(props.competition, props.entryId);
  const [draft, setDraft] = useState<string | null>(null);
  const previous = credit.data?.current_vote ?? 0;
  const value = draft ?? String(previous);
  const numeric = Number(value);
  const total = Number.isSafeInteger(numeric) ? numeric : previous;
  const rationale = useSingleWaveDropVoteRationale({
    drop,
    voteTotal: total,
    voteChange: total - previous,
  });
  const invalid =
    rationale.shouldPostRationale && !rationale.rationaleText.trim();
  const content = (
    <div className="group-[.is-vote-panel]/inline-vote:tw-col-span-2 group-[.is-vote-panel]/inline-vote:tw-col-start-1 group-[.is-vote-panel]/inline-vote:tw-row-start-4 group-[.is-vote-panel]/inline-vote:tw-flex group-[.is-vote-panel]/inline-vote:tw-min-w-0 group-[.is-vote-panel]/inline-vote:tw-flex-col">
      <label className="tw-flex tw-min-h-11 tw-w-fit tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-200 group-[.is-vote-panel]/inline-vote:tw-order-2 group-[.is-vote-panel]/inline-vote:tw-min-h-[34px] group-[.is-vote-panel]/inline-vote:tw-gap-1.5 group-[.is-vote-panel]/inline-vote:tw-rounded-md group-[.is-vote-panel]/inline-vote:tw-text-[13px] group-[.is-vote-panel]/inline-vote:tw-text-iron-400 group-[.is-vote-panel]/inline-vote:tw-transition-colors group-[.is-vote-panel]/inline-vote:tw-duration-150 group-[.is-vote-panel]/inline-vote:has-[:checked]:tw-text-iron-100 group-[.is-vote-panel]/inline-vote:has-[:focus-visible]:tw-ring-2 group-[.is-vote-panel]/inline-vote:has-[:focus-visible]:tw-ring-primary-400 group-[.is-vote-panel]/inline-vote:desktop-hover:hover:tw-text-iron-50 group-[.is-vote-panel]/inline-vote:motion-reduce:tw-transition-none group-[.is-vote-panel]/inline-vote:max-sm:tw-text-sm">
        <span className="tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-items-center group-[.is-vote-panel]/inline-vote:tw-size-3.5">
          <input
            type="checkbox"
            role="switch"
            checked={rationale.shouldPostRationale}
            onChange={(event) =>
              rationale.handlePostRationaleChange(event.target.checked)
            }
            aria-controls={rationale.shouldPostRationale ? fieldId : undefined}
            aria-describedby={
              rationale.shouldPostRationale
                ? publicReplyDescriptionId
                : undefined
            }
            className="tw-peer tw-sr-only"
          />
          <span
            aria-hidden="true"
            className={`tw-absolute tw-inset-0 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors group-[.is-vote-panel]/inline-vote:tw-hidden peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none ${rationale.shouldPostRationale ? "tw-bg-primary-500" : "tw-bg-iron-650"}`}
          />
          <span
            aria-hidden="true"
            className={`tw-absolute tw-left-0.5 tw-top-0.5 tw-size-5 tw-rounded-full tw-bg-iron-50 tw-shadow tw-transition-transform group-[.is-vote-panel]/inline-vote:tw-hidden motion-reduce:tw-transition-none ${rationale.shouldPostRationale ? "tw-translate-x-5" : ""}`}
          />
          <ChatBubbleLeftIcon
            aria-hidden="true"
            className="tw-hidden tw-size-3.5 group-[.is-vote-panel]/inline-vote:tw-block peer-checked:tw-fill-current"
          />
        </span>
        {t(locale, "waves.voteRationale.switchLabel")}
      </label>
      <div
        aria-hidden={!rationale.shouldPostRationale}
        inert={!rationale.shouldPostRationale}
        className={`tw-grid tw-transition-[grid-template-rows,opacity] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none ${
          rationale.shouldPostRationale
            ? "tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div className="tw-min-h-0 tw-overflow-hidden">
          <div className="tw-space-y-3 tw-pt-3 group-[.is-vote-panel]/inline-vote:tw-flex group-[.is-vote-panel]/inline-vote:tw-flex-col group-[.is-vote-panel]/inline-vote:tw-gap-1.5 group-[.is-vote-panel]/inline-vote:tw-space-y-0 group-[.is-vote-panel]/inline-vote:tw-pb-3 group-[.is-vote-panel]/inline-vote:tw-pt-0">
            <p
              id={publicReplyDescriptionId}
              className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400 group-[.is-vote-panel]/inline-vote:tw-order-2 group-[.is-vote-panel]/inline-vote:tw-leading-[14px] group-[.is-vote-panel]/inline-vote:tw-text-iron-500"
            >
              {t(locale, "waves.voteRationale.publicReplyDescription")}
            </p>
            <div className="tw-space-y-2 group-[.is-vote-panel]/inline-vote:tw-space-y-0">
              <label
                htmlFor={fieldId}
                className="tw-block tw-text-xs tw-font-semibold tw-text-iron-300 group-[.is-vote-panel]/inline-vote:tw-sr-only"
              >
                {t(locale, "waves.voteRationale.fieldLabel")}
              </label>
              <div className="tw-block group-[.is-vote-panel:not(.is-mini)]/inline-vote:tw-h-24 group-[.is-vote-panel]/inline-vote:tw-h-14 group-[.is-vote-panel]/inline-vote:tw-min-h-14 group-[.is-vote-panel]/inline-vote:tw-resize-y group-[.is-vote-panel]/inline-vote:tw-overflow-hidden group-[.is-vote-panel]/inline-vote:tw-rounded-lg">
                <textarea
                  id={fieldId}
                  rows={4}
                  placeholder={getVoteRationaleReplyMarkdown({
                    voteTotal: total,
                    voteChange: total - previous,
                    locale,
                  }).trimEnd()}
                  value={
                    rationale.isUsingGeneratedRationale
                      ? ""
                      : rationale.rationaleText
                  }
                  onChange={(event) =>
                    rationale.handleRationaleTextChange(event.target.value)
                  }
                  aria-invalid={Boolean(invalid)}
                  aria-describedby={invalid ? descriptionId : undefined}
                  className={`tw-block tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 group-[.is-vote-panel]/inline-vote:tw-h-full group-[.is-vote-panel]/inline-vote:tw-min-h-full group-[.is-vote-panel]/inline-vote:tw-resize-none group-[.is-vote-panel]/inline-vote:tw-overflow-clip group-[.is-vote-panel]/inline-vote:tw-border-iron-800 group-[.is-vote-panel]/inline-vote:tw-px-2.5 group-[.is-vote-panel]/inline-vote:tw-py-2 group-[.is-vote-panel]/inline-vote:tw-text-xs group-[.is-vote-panel]/inline-vote:tw-leading-[18px] group-[.is-vote-panel]/inline-vote:placeholder:tw-text-iron-600 focus:tw-border-primary-400 focus:tw-outline-none group-[.is-vote-panel]/inline-vote:focus:tw-border-primary-400 group-[.is-vote-panel]/inline-vote:touch-only:tw-text-base group-[.is-vote-panel]/inline-vote:max-sm:tw-text-base ${
                    rationale.isUsingGeneratedRationale
                      ? "tw-text-iron-600"
                      : "tw-text-iron-100"
                  }`}
                />
              </div>
              {invalid && (
                <p
                  id={descriptionId}
                  role="alert"
                  className="tw-pt-1 tw-text-xs tw-leading-4 tw-text-rose-400"
                >
                  {t(locale, "waves.voteRationale.emptyBlockReason")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <CompetitionVoteForm
      {...props}
      controlledDraft={{ value, onChange: setDraft }}
      reply={{
        content,
        isValid: !invalid,
        onVoteApplied: () => rationale.submitRationaleReply(drop),
      }}
    />
  );
}
