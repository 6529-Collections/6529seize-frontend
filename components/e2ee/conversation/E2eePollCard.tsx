"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
  E2eePoll,
} from "@/lib/e2ee/types";
import { getMemberName } from "../e2eeFormat";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";

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
  const ballot =
    selfProfileId && Object.hasOwn(poll.ballots, selfProfileId)
      ? (poll.ballots[selfProfileId] ?? [])
      : [];
  const ballotKey = ballot.join(",");
  const [draft, setDraft] = useState<{
    base: string;
    options: number[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ending, setEnding] = useState(false);
  const options = draft?.base === ballotKey ? draft.options : ballot;
  const updatePoll = engine.updatePoll?.bind(engine);
  const canUpdate = canAct && updatePoll !== undefined && !poll.closed;
  const canVote =
    canUpdate &&
    poll.eligibleDeviceKeys.includes(engine.getLocalDeviceKey() ?? "");
  const canEnd = canUpdate && selfProfileId === message.senderProfileId;
  const openMode = poll.multi ? "e2ee.poll.multiple" : "e2ee.poll.single";
  const statusLabel = poll.closed ? "e2ee.poll.closed" : openMode;
  const voters = poll.options.map((_, index) =>
    Object.entries(poll.ballots)
      .filter(([, selections]) => selections.includes(index))
      .map(([profile]) =>
        getMemberName(locale, conversation.members, profile, selfProfileId)
      )
  );

  function select(index: number) {
    let nextOptions = [index];
    if (poll.multi) {
      nextOptions = options.includes(index)
        ? options.filter((option) => option !== index)
        : [...options, index];
    }
    setDraft({ base: ballotKey, options: nextOptions });
  }

  async function vote() {
    if (!updatePoll || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await updatePoll(message.g, message.id, options);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={labelId}
      className="tw-my-1 tw-w-full tw-max-w-lg tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3"
    >
      <h3
        id={labelId}
        className="tw-mb-1 tw-break-words tw-text-base tw-font-semibold tw-text-iron-50"
      >
        {poll.question}
      </h3>
      <p className="tw-mb-2 tw-text-sm tw-text-iron-400">
        {t(locale, statusLabel)}
      </p>
      <fieldset
        aria-labelledby={labelId}
        disabled={busy}
        className="tw-space-y-1"
      >
        {poll.options.map((label, index) => (
          <label
            key={label}
            className="tw-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100"
          >
            {canVote && (
              <input
                type={poll.multi ? "checkbox" : "radio"}
                name={labelId}
                checked={options.includes(index)}
                onChange={() => select(index)}
              />
            )}
            <span className="tw-min-w-0 tw-flex-1 tw-break-words">{label}</span>
            <span
              className="tw-shrink-0 tw-text-iron-400"
              aria-label={t(locale, "e2ee.poll.voteCount", {
                count: formatInteger(locale, voters[index]?.length ?? 0),
              })}
            >
              {formatInteger(locale, voters[index]?.length ?? 0)}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
        {canVote && (
          <>
            <Button
              variant="action"
              size="sm"
              loading={busy}
              disabled={
                options.length === ballot.length &&
                options.every((option) => ballot.includes(option))
              }
              onClick={() => void vote()}
            >
              {t(
                locale,
                ballot.length ? "e2ee.poll.updateVote" : "e2ee.poll.vote"
              )}
            </Button>
            {options.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => setDraft({ base: ballotKey, options: [] })}
              >
                {t(locale, "e2ee.poll.clearSelection")}
              </Button>
            )}
          </>
        )}
        {canEnd && (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setEnding(true)}
            >
              {t(locale, "e2ee.poll.end")}
            </Button>
            <E2eeConfirmDialog
              open={ending}
              title={t(locale, "e2ee.poll.end")}
              body={t(locale, "e2ee.poll.endConfirm")}
              confirmLabel={t(locale, "e2ee.poll.end")}
              destructive={false}
              onClose={() => setEnding(false)}
              onConfirm={() => updatePoll(message.g, message.id, null)}
            />
          </>
        )}
      </div>
      {failed && (
        <p role="alert" className="tw-mt-2 tw-text-sm tw-text-rose-300">
          {t(locale, "e2ee.message.actionFailed")}
        </p>
      )}
      {voters.some((names) => names.length > 0) && (
        <details className="tw-mt-2 tw-text-sm tw-text-iron-300">
          <summary className="tw-min-h-8 tw-cursor-pointer tw-py-1 focus-visible:tw-outline focus-visible:tw-outline-primary-400">
            {t(locale, "e2ee.poll.viewVotes")}
          </summary>
          <dl className="tw-mb-1 tw-space-y-2 tw-break-words">
            {poll.options.map((label, index) => (
              <div key={label}>
                <dt className="tw-font-medium">{label}</dt>
                <dd className="tw-m-0 tw-text-iron-400">
                  {(voters[index]?.length ?? 0) > 0
                    ? formatList(locale, voters[index] ?? [])
                    : t(locale, "e2ee.poll.noVotes")}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}
