"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FocusEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { getNativeComposerStyle } from "@/components/waves/composerPresentation";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  groupConversationThreads,
  isUsableDm,
} from "@/lib/e2ee/dm-conversations";
import type { E2eeConversation, E2eeEngine } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey, getE2eeErrorCode } from "../e2eeErrors";
import { getConversationTitle, getMemberName } from "../e2eeFormat";
import { getComposerContainerClassName } from "./E2eeComposer";

const isFocusLost = (): boolean => {
  const active = document.activeElement;
  return active === null || active === document.body;
};

/**
 * Hands focus from the composer to the continue action when a conversation
 * turns read-only while open (D172), and otherwise announces the change
 * once. Opening an already read-only conversation does neither.
 */
export function useSupersededHandoff(composerShown: boolean) {
  const locale = useBrowserLocale();
  const composerShownRef = useRef(false);
  const focusedRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (composerShown) {
      composerShownRef.current = true;
    }
  }, [composerShown]);

  const onFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);
  // A removed element or a window switch blurs with no next target: focus
  // has not moved elsewhere on the page, so it still counts as here.
  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) {
      focusedRef.current = false;
    }
  }, []);

  /** Called once by the read-only panel when it mounts. */
  const takeFocus = useCallback((): boolean => {
    if (!composerShownRef.current) {
      return false;
    }
    composerShownRef.current = false;
    const take = focusedRef.current && isFocusLost();
    focusedRef.current = false;
    if (!take) {
      setAnnouncement(t(locale, "e2ee.superseded.announce"));
    }
    return take;
  }, [locale]);

  return { onFocus, onBlur, takeFocus, announcement };
}

/** The conversation to continue in, when this device already has it. */
function getContinuationG(
  conversation: E2eeConversation,
  conversations: readonly E2eeConversation[],
  selfProfileId: string | null
): string | null {
  if (conversation.kind === "dm") {
    const thread = groupConversationThreads(conversations, selfProfileId).find(
      (item) => item.sessions.some((session) => session.g === conversation.g)
    );
    const current = thread?.current;
    return current &&
      current.g !== conversation.g &&
      isUsableDm(current, selfProfileId)
      ? current.g
      : null;
  }
  const successor = conversation.successor ?? null;
  return successor !== null &&
    conversations.some((item) => item.g === successor)
    ? successor
    : null;
}

interface RestartError {
  readonly key: MessageKey;
  readonly params: Record<string, string>;
}

function getRestartError(
  locale: SupportedLocale,
  error: unknown,
  conversation: E2eeConversation,
  selfProfileId: string | null
): RestartError {
  if (getE2eeErrorCode(error) === "E2EE_NO_DEVICES") {
    return conversation.kind === "dm"
      ? {
          key: "e2ee.superseded.noDevices.dm",
          params: {
            name: getConversationTitle(locale, conversation, selfProfileId),
          },
        }
      : { key: "e2ee.superseded.noDevices.group", params: {} };
  }
  return {
    key: getE2eeActionErrorKey(error, "e2ee.banner.restartFailed"),
    params: {},
  };
}

/** Members of `previous` (but not you) missing from the new conversation. */
function getSkippedNames(
  locale: SupportedLocale,
  previous: E2eeConversation,
  next: E2eeConversation | null,
  selfProfileId: string | null
): string[] {
  // A delayed creation has not added anyone yet; its own banner explains.
  if (!next || next.delayed) {
    return [];
  }
  const joined = new Set(next.members.map((member) => member.profileId));
  return previous.members
    .filter(
      (member) =>
        member.profileId !== selfProfileId && !joined.has(member.profileId)
    )
    .map((member) =>
      getMemberName(locale, previous.members, member.profileId, selfProfileId)
    );
}

interface E2eeSupersededComposerProps {
  readonly conversation: E2eeConversation;
  readonly conversations: readonly E2eeConversation[];
  readonly selfProfileId: string | null;
  readonly engine: E2eeEngine;
  /** Id for the action, so a skip link can move focus to it. */
  readonly actionId: string;
  /** Whether the replaced composer held focus (then the action takes it). */
  readonly takeFocus: () => boolean;
}

/**
 * Replaces the composer of a conversation made under an earlier encryption
 * suite (D172): its history stays readable, and a DM continues in a new
 * session while a group starts again with the same members.
 */
export function E2eeSupersededComposer({
  conversation,
  conversations,
  selfProfileId,
  engine,
  actionId,
  takeFocus,
}: E2eeSupersededComposerProps) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const { isCapacitor } = useCapacitor();
  const bodyId = useId();
  const actionRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<RestartError | null>(null);
  // A group restarted without everyone: stay to say who, then link to it.
  const [started, setStarted] = useState<{
    readonly g: string;
    readonly skipped: string;
  } | null>(null);
  const isDm = conversation.kind === "dm";
  const continuationG =
    started?.g ?? getContinuationG(conversation, conversations, selfProfileId);

  useLayoutEffect(() => {
    if (takeFocus()) {
      actionRef.current?.focus();
    }
  }, [takeFocus]);

  // The restart button turns into a link: keep keyboard focus on the action.
  useLayoutEffect(() => {
    if (started && isFocusLost()) {
      actionRef.current?.focus();
    }
  }, [started]);

  const restart = async () => {
    setPending(true);
    setError(null);
    try {
      const g = await engine.restart(conversation.g);
      const skipped = isDm
        ? []
        : getSkippedNames(
            locale,
            conversation,
            engine.getConversation(g),
            selfProfileId
          );
      if (skipped.length > 0) {
        setStarted({ g, skipped: formatList(locale, skipped) });
        return;
      }
      router.push(getEncryptedConversationRoute(g));
    } catch (error_) {
      setError(getRestartError(locale, error_, conversation, selfProfileId));
    } finally {
      // A slow or blocked navigation must not leave the action stuck;
      // restart is idempotent, so another press opens the same chat.
      setPending(false);
    }
  };

  const linkLabel: MessageKey = isDm
    ? "e2ee.superseded.continueDm"
    : "e2ee.superseded.openSuccessor";
  const buttonLabel: MessageKey = isDm
    ? "e2ee.superseded.continueDm"
    : "e2ee.superseded.restartGroup";

  return (
    <div
      className={getComposerContainerClassName(isCapacitor)}
      style={getNativeComposerStyle(isCapacitor)}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center">
        <p
          id={bodyId}
          className="tw-m-0 tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-2 tw-text-sm tw-leading-5 tw-text-iron-300"
        >
          <LockClosedIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
          />
          <span>{t(locale, "e2ee.superseded.body")}</span>
        </p>
        {continuationG ? (
          <Link
            ref={actionRef}
            id={actionId}
            href={getEncryptedConversationRoute(continuationG)}
            aria-describedby={bodyId}
            className={getButtonClasses({
              variant: "action",
              size: "md",
              className: "tw-no-underline sm:tw-self-center",
            })}
          >
            {t(locale, linkLabel)}
          </Link>
        ) : (
          <Button
            ref={actionRef}
            id={actionId}
            variant="action"
            size="md"
            loading={pending}
            aria-describedby={bodyId}
            onClick={() => void restart()}
            className="!tw-whitespace-normal tw-text-center sm:tw-self-center"
          >
            {t(locale, buttonLabel)}
          </Button>
        )}
      </div>
      {error ? (
        <p
          role="alert"
          className="tw-m-0 tw-px-4 tw-pb-3 tw-text-sm tw-leading-5 tw-text-rose-300"
        >
          {t(locale, error.key, error.params)}
        </p>
      ) : null}
      <output
        className={
          started
            ? "tw-block tw-px-4 tw-pb-3 tw-text-sm tw-leading-5 tw-text-amber-100"
            : "tw-sr-only"
        }
      >
        {started
          ? t(locale, "e2ee.superseded.skipped", { names: started.skipped })
          : null}
      </output>
    </div>
  );
}
