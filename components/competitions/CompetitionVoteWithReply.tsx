"use client";

import { useId, useState, type ComponentProps } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
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
    <div className="tw-space-y-3">
      <label className="tw-flex tw-min-h-11 tw-w-fit tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-200">
        <span className="tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-items-center">
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
            className={`tw-absolute tw-inset-0 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none ${rationale.shouldPostRationale ? "tw-bg-primary-500" : "tw-bg-iron-650"}`}
          />
          <span
            aria-hidden="true"
            className={`tw-absolute tw-left-0.5 tw-top-0.5 tw-size-5 tw-rounded-full tw-bg-iron-50 tw-shadow tw-transition-transform motion-reduce:tw-transition-none ${rationale.shouldPostRationale ? "tw-translate-x-5" : ""}`}
          />
        </span>
        {t(locale, "waves.voteRationale.switchLabel")}
      </label>
      {rationale.shouldPostRationale && (
        <p
          id={publicReplyDescriptionId}
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(locale, "waves.voteRationale.publicReplyDescription")}
        </p>
      )}
      {rationale.shouldPostRationale && (
        <div className="tw-space-y-2">
          <label
            htmlFor={fieldId}
            className="tw-block tw-text-xs tw-font-semibold tw-text-iron-300"
          >
            {t(locale, "waves.voteRationale.fieldLabel")}
          </label>
          <textarea
            id={fieldId}
            rows={4}
            value={rationale.rationaleText}
            onChange={(event) =>
              rationale.handleRationaleTextChange(event.target.value)
            }
            aria-invalid={Boolean(invalid)}
            aria-describedby={invalid ? descriptionId : undefined}
            className="tw-block tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
          />
          {invalid && (
            <p
              id={descriptionId}
              role="alert"
              className="tw-text-sm tw-text-iron-300"
            >
              {t(locale, "waves.voteRationale.emptyBlockReason")}
            </p>
          )}
        </div>
      )}
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
