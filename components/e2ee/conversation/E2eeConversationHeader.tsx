"use client";

import {
  ArrowLeftIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { getConversationTitle, getDmPeer, tCount } from "../e2eeFormat";
import { E2eeAvatar, E2eeAvatarStack } from "../ui/E2eeAvatar";
import { E2eeBadge } from "../ui/E2eeBadge";

const ICON_BUTTON =
  "tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.05] tw-text-iron-200 tw-transition-colors hover:tw-border-white/10 hover:tw-bg-white/[0.08] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 aria-expanded:tw-bg-white/10";

interface E2eeConversationHeaderProps {
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly searchOpen: boolean;
  readonly searchPanelId: string;
  readonly onToggleSearch: () => void;
  readonly onOpenInfo: () => void;
}

export function E2eeConversationHeader({
  conversation,
  selfProfileId,
  searchOpen,
  searchPanelId,
  onToggleSearch,
  onOpenInfo,
}: E2eeConversationHeaderProps) {
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
    <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2.5 sm:tw-px-4">
      <Link
        href={getEncryptedMessagesRoute()}
        aria-label={t(locale, "e2ee.conversation.back")}
        className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-no-underline hover:tw-bg-iron-900 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-hidden"
      >
        <ArrowLeftIcon aria-hidden="true" className="tw-size-5" />
      </Link>
      {peer || conversation.kind === "dm" ? (
        <E2eeAvatar
          pfp={peer?.pfp ?? null}
          name={peer?.handle ?? title}
          size="md"
        />
      ) : (
        <E2eeAvatarStack people={others} max={3} size="sm" />
      )}
      <div className="tw-min-w-0 tw-flex-1">
        <h1 className="tw-m-0 tw-truncate tw-text-base tw-font-semibold tw-text-iron-50 lg:tw-text-lg">
          {title}
        </h1>
        <div className="tw-mt-0.5 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <E2eeBadge
            label={t(locale, "e2ee.badge.encrypted")}
            shortLabel={t(locale, "e2ee.badge.encryptedShort")}
          />
          {conversation.kind === "group" ? (
            <span className="tw-text-xs tw-text-iron-400">
              {tCount(
                locale,
                {
                  one: "e2ee.conversation.members.one",
                  other: "e2ee.conversation.members.other",
                },
                conversation.members.length
              )}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleSearch}
        aria-expanded={searchOpen}
        aria-controls={searchOpen ? searchPanelId : undefined}
        aria-label={t(locale, "e2ee.conversation.search.open")}
        title={t(locale, "e2ee.conversation.search.open")}
        className={ICON_BUTTON}
      >
        <MagnifyingGlassIcon aria-hidden="true" className="tw-size-4" />
      </button>
      <button
        type="button"
        onClick={onOpenInfo}
        aria-haspopup="dialog"
        aria-label={t(locale, "e2ee.conversation.info")}
        title={t(locale, "e2ee.conversation.info")}
        className={ICON_BUTTON}
      >
        <InformationCircleIcon aria-hidden="true" className="tw-size-5" />
      </button>
    </div>
  );
}
