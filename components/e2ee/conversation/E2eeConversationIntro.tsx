"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { getConversationTitle, getDmPeer } from "../e2eeFormat";
import { E2eeAvatar, E2eeAvatarStack } from "../ui/E2eeAvatar";

interface E2eeConversationIntroProps {
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  /** No messages on this device yet: invite the first one. */
  readonly empty: boolean;
}

/**
 * The start of this chat on this device: who it is with, that it is
 * end-to-end encrypted, and (honestly) that a device only holds messages
 * from the time it joined, because there is no history backup.
 */
export function E2eeConversationIntro({
  conversation,
  selfProfileId,
  empty,
}: E2eeConversationIntroProps) {
  const locale = useBrowserLocale();
  const title = getConversationTitle(locale, conversation, selfProfileId);
  const peer = getDmPeer(conversation, selfProfileId);
  const others = conversation.members
    .filter((member) => member.profileId !== selfProfileId)
    .map((member) => ({
      key: member.profileId,
      pfp: member.pfp,
      name: member.handle ?? title,
    }));

  return (
    <div className="tw-mx-auto tw-flex tw-max-w-md tw-flex-col tw-items-center tw-px-6 tw-pb-6 tw-pt-10 tw-text-center">
      {peer || conversation.kind === "dm" ? (
        <E2eeAvatar
          pfp={peer?.pfp ?? null}
          name={peer?.handle ?? title}
          size="lg"
        />
      ) : (
        <E2eeAvatarStack people={others} max={3} size="md" />
      )}
      <h2 className="tw-m-0 tw-mt-3 tw-max-w-full tw-truncate tw-text-base tw-font-semibold tw-text-iron-50">
        {title}
      </h2>
      <p className="tw-m-0 tw-mt-3 tw-inline-flex tw-items-start tw-gap-1.5 tw-text-left tw-text-xs tw-leading-5 tw-text-iron-300">
        <LockClosedIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-3.5 tw-flex-shrink-0 tw-text-emerald-300"
        />
        <span>{t(locale, "e2ee.conversation.intro.encrypted")}</span>
      </p>
      <p className="tw-m-0 tw-mt-1.5 tw-text-xs tw-leading-5 tw-text-iron-500">
        {t(locale, "e2ee.conversation.intro.deviceHistory")}
      </p>
      {empty ? (
        <p className="tw-m-0 tw-mt-6 tw-text-sm tw-text-iron-300">
          {t(locale, "e2ee.conversation.empty")}
        </p>
      ) : null}
    </div>
  );
}
