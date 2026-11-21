"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import {
  POLL_CARD_CLASS_NAME,
  POLL_FOOTER_CLASS_NAME,
  PollCardHeader,
  PollVotedStatus,
} from "@/components/waves/drops/poll/PollCardPresentation";
import { PollResultOption } from "@/components/waves/drops/poll/PollResultOption";
import { PollVoteOption } from "@/components/waves/drops/poll/PollVoteOption";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
  E2eePoll,
} from "@/lib/e2ee/types";
import { getMemberName } from "../e2eeFormat";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";

type PollView = "vote" | "results";
type Selection = { readonly base: number; readonly options: number[] };
type VoteStatus = "idle" | "sending" | "failed";

const sameSelection = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((option) => b.includes(option));

function getProfileBallot(
  ballots: E2eePoll["ballots"],
  profileId: string | null
) {
  return profileId && Object.hasOwn(ballots, profileId)
    ? ballots[profileId]
    : undefined;
}

function E2eePollResults({
  poll,
  members,
  selfProfileId,
  ballot,
}: {
  readonly poll: E2eePoll;
  readonly members: E2eeConversation["members"];
  readonly selfProfileId: string | null;
  readonly ballot: readonly number[];
}) {
  const locale = useBrowserLocale();
  const [expanded, setExpanded] = useState<number | null>(null);
  const voters: string[][] = poll.options.map(() => []);
  for (const [profile, selection] of Object.entries(poll.ballots)) {
    const name = getMemberName(locale, members, profile, selfProfileId);
    for (const index of selection.options) {
      voters[index]?.push(name);
    }
  }
  const totalVotes = voters.reduce((total, names) => total + names.length, 0);

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      {poll.options.map((label, index) => {
        const names = voters[index] ?? [];
        const isSelected = ballot.includes(index);
        const isExpanded = expanded === index && names.length > 0;
        return (
          <div key={label}>
            <PollResultOption
              label={label}
              votes={names.length}
              totalVotes={totalVotes}
              canShowVoters={names.length > 0}
              isSelected={isSelected}
              isDimmed={ballot.length > 0 && !isSelected}
              isExpanded={isExpanded}
              showSelectionIndicator={ballot.length > 0}
              onToggle={() => setExpanded(isExpanded ? null : index)}
            />
            {isExpanded && (
              <p className="tw-mb-1 tw-mt-1 tw-break-words tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-xs tw-text-iron-200">
                {formatList(locale, names)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PollBallotActions({
  hasVoted,
  canSubmit,
  busy,
  onVote,
  onClear,
}: {
  readonly hasVoted: boolean;
  readonly canSubmit: boolean;
  readonly busy: boolean;
  readonly onVote: () => void;
  readonly onClear: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <Button
        variant="action"
        size="xs"
        loading={busy}
        disabled={!canSubmit}
        onClick={onVote}
      >
        {t(locale, hasVoted ? "e2ee.poll.updateVote" : "e2ee.poll.vote")}
      </Button>
      {onClear && (
        <Button variant="secondary" size="xs" disabled={busy} onClick={onClear}>
          {t(locale, "e2ee.poll.clearSelection")}
        </Button>
      )}
    </>
  );
}

function EndPollAction({
  busy,
  onEnd,
}: {
  readonly busy: boolean;
  readonly onEnd: () => Promise<void>;
}) {
  const locale = useBrowserLocale();
  const [ending, setEnding] = useState(false);
  const label = t(locale, "e2ee.poll.end");
  return (
    <>
      <Button
        variant="secondary"
        size="xs"
        disabled={busy}
        onClick={() => setEnding(true)}
      >
        {label}
      </Button>
      <E2eeConfirmDialog
        open={ending}
        title={label}
        body={t(locale, "e2ee.poll.endConfirm")}
        confirmLabel={label}
        destructive={false}
        errorFallbackKey="e2ee.message.actionFailed"
        onClose={() => setEnding(false)}
        onConfirm={onEnd}
      />
    </>
  );
}

export function E2eePollCard({
  message,
  poll,
  conversation,
  engine,
  selfProfileId,
  canAct,
}: {
  readonly message: E2eeMessage;
  readonly poll: E2eePoll;
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
  readonly canAct: boolean;
}) {
  const locale = useBrowserLocale();
  const labelId = useId();
  const ownBallot = getProfileBallot(poll.ballots, selfProfileId);
  const ballot = ownBallot?.options ?? [];
  const ballotKey = ownBallot?.seq ?? 0;
  const [view, setView] = useState<PollView | null>(null);
  const [draft, setDraft] = useState<Selection | null>(null);
  const [submitted, setSubmitted] = useState<Selection | null>(null);
  const [status, setStatus] = useState<VoteStatus>("idle");

  const busy = status === "sending";
  const options = draft?.base === ballotKey ? draft.options : ballot;
  const queued = submitted?.base === ballotKey;
  const selectionIsQueued = queued && sameSelection(options, submitted.options);
  const canSubmit = !selectionIsQueued && !sameSelection(options, ballot);
  const updatePoll = engine.updatePoll?.bind(engine);
  const canUpdate = canAct && updatePoll !== undefined && !poll.closed;
  const canVote =
    canUpdate &&
    poll.eligibleDeviceKeys.includes(
      engine.getLocalDeviceKey()?.toLowerCase() ?? ""
    );
  const canEnd = canUpdate && selfProfileId === message.senderProfileId;
  const hasVoted = ballot.length > 0;
  const showResults =
    !canVote || (view === null ? hasVoted : view === "results");
  const hasSelection = options.length > 0;
  const showBallotActions = !showResults && (hasSelection || hasVoted);

  function select(index: number) {
    let nextOptions = [index];
    if (poll.multi) {
      nextOptions = options.includes(index)
        ? options.filter((option) => option !== index)
        : [...options, index];
    }
    setDraft({ base: ballotKey, options: nextOptions });
  }

  function toggleView() {
    if (!showResults && hasVoted) {
      setDraft(null);
    }
    setStatus("idle");
    setView(showResults ? "vote" : "results");
  }

  async function vote() {
    if (!updatePoll || !canVote || !canSubmit || busy) return;
    setStatus("sending");
    try {
      await updatePoll(message.g, message.id, options);
      setSubmitted({ base: ballotKey, options });
      setView("results");
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }

  const returnToVote = hasVoted
    ? "waves.poll.actions.changeVote"
    : "waves.poll.actions.vote";
  const switchToResults = hasVoted
    ? "e2ee.action.cancel"
    : "waves.poll.actions.viewResults";

  return (
    <section aria-labelledby={labelId} className="tw-min-w-0">
      <h3
        id={labelId}
        className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50"
      >
        {poll.question}
      </h3>
      <div className={POLL_CARD_CLASS_NAME}>
        <PollCardHeader
          title={t(locale, "e2ee.poll.title")}
          status={t(
            locale,
            poll.closed ? "e2ee.poll.closed" : "e2ee.poll.open"
          )}
          open={!poll.closed}
        />
        {showResults ? (
          <E2eePollResults
            poll={poll}
            members={conversation.members}
            selfProfileId={selfProfileId}
            ballot={ballot}
          />
        ) : (
          <fieldset
            aria-labelledby={labelId}
            disabled={busy}
            className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-border-0 tw-p-0"
          >
            {poll.options.map((label, index) => (
              <PollVoteOption
                key={label}
                label={label}
                checked={options.includes(index)}
                multichoice={poll.multi}
                groupName={labelId}
                disabled={busy}
                onChange={() => select(index)}
              />
            ))}
          </fieldset>
        )}
        {(canVote || canEnd) && (
          <div className={POLL_FOOTER_CLASS_NAME}>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {canVote && (
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={busy}
                  onClick={toggleView}
                >
                  {t(locale, showResults ? returnToVote : switchToResults)}
                </Button>
              )}
              {showBallotActions && (
                <PollBallotActions
                  hasVoted={hasVoted}
                  canSubmit={canSubmit}
                  busy={busy}
                  onVote={() => void vote()}
                  onClear={
                    hasSelection
                      ? () => setDraft({ base: ballotKey, options: [] })
                      : undefined
                  }
                />
              )}
              <div className="tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-gap-2 empty:tw-hidden">
                {showResults && hasVoted && (
                  <PollVotedStatus
                    label={t(locale, "waves.poll.status.voted")}
                  />
                )}
                {canEnd && (
                  <EndPollAction
                    busy={busy}
                    onEnd={() => updatePoll(message.g, message.id, null)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {queued && !poll.closed && (
          <output className="tw-mt-2 tw-block tw-text-xs tw-text-iron-400">
            {t(locale, "e2ee.poll.voteQueued")}
          </output>
        )}
        {status === "failed" && (
          <p
            role="alert"
            className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-rose-300"
          >
            {t(locale, "e2ee.message.actionFailed")}
          </p>
        )}
      </div>
    </section>
  );
}
