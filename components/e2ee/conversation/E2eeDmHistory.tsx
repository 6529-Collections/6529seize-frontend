"use client";

import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { withDisplayTimeZoneDate } from "@/lib/display-time-zone/displayTimeZone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import {
  groupConversationThreads,
  isUsableDm,
} from "@/lib/e2ee/dm-conversations";
import type { E2eeConversation, E2eeEngine } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";

/** Switch histories without duplicating a person in the inbox or deleting keys. */
export function E2eeDmHistory({
  conversation,
  conversations,
  selfProfileId,
  engine,
}: {
  readonly conversation: E2eeConversation;
  readonly conversations: readonly E2eeConversation[];
  readonly selfProfileId: string | null;
  readonly engine: E2eeEngine;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const router = useRouter();
  const id = useId();
  const [restarting, setRestarting] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const thread = groupConversationThreads(conversations, selfProfileId).find(
    (item) => item.sessions.some((session) => session.g === conversation.g)
  );
  if (conversation.kind !== "dm" || !thread?.key.startsWith("dm:")) return null;
  const usable = isUsableDm(conversation, selfProfileId);
  const current = isUsableDm(thread.current, selfProfileId)
    ? thread.current
    : null;
  // A superseded session continues from its composer area (D172).
  const offersNext = !usable && conversation.status !== "superseded";
  if (thread.sessions.length === 1 && !offersNext) return null;

  const restart = async () => {
    setRestarting(true);
    setErrorKey(null);
    try {
      const g = await engine.restart(conversation.g);
      router.push(getEncryptedConversationRoute(g));
    } catch (error) {
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.banner.restartFailed"));
      setRestarting(false);
    }
  };

  return (
    <section
      aria-label={t(locale, "e2ee.dm.history.label")}
      className="tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-2 tw-border-b tw-border-solid tw-border-white/10 tw-px-4 tw-py-3"
    >
      {thread.sessions.length > 1 ? (
        <>
          <label
            htmlFor={id}
            className="tw-text-xs tw-font-semibold tw-text-iron-200"
          >
            {t(locale, "e2ee.dm.history.label")}
          </label>
          <div className="tw-relative">
            <select
              id={id}
              value={conversation.g}
              aria-describedby={`${id}-hint`}
              onChange={(event) =>
                router.push(getEncryptedConversationRoute(event.target.value))
              }
              className="tw-block tw-min-h-10 tw-w-full tw-min-w-0 tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-py-2 tw-pl-3 tw-pr-10 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
            >
              {thread.sessions.map((session, index) => (
                <option key={session.g} value={session.g}>
                  {t(
                    locale,
                    session.g === current?.g
                      ? "e2ee.dm.history.current"
                      : "e2ee.dm.history.saved",
                    {
                      number: formatInteger(locale, index + 1),
                      date: formatDate(
                        locale,
                        session.updatedAt,
                        withDisplayTimeZoneDate(zone, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ),
                      count: formatInteger(locale, session.unread),
                    }
                  )}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-100"
            />
          </div>
          <p
            id={`${id}-hint`}
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "e2ee.dm.history.hint")}
          </p>
        </>
      ) : null}
      {offersNext && current ? (
        <Link
          href={getEncryptedConversationRoute(current.g)}
          className="tw-inline-flex tw-min-h-8 tw-items-center tw-self-start tw-rounded-lg tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "e2ee.dm.history.openCurrent")}
        </Link>
      ) : null}
      {offersNext && !current && conversation.status !== "invalid" ? (
        <Button
          variant="secondary"
          size="sm"
          loading={restarting}
          onClick={() => void restart()}
        >
          {t(locale, "e2ee.dm.history.continue")}
        </Button>
      ) : null}
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-xs tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
    </section>
  );
}
