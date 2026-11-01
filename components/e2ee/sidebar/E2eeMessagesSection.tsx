"use client";

import { ChevronRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import {
  getEncryptedConversationIdFromPathname,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { E2eeConversationList } from "../list/E2eeConversationList";
import { E2eeNewChatLink } from "../list/E2eeConversationListPage";

const SIDEBAR_LIMIT = 8;
const HEADING_CLASS =
  "tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";

interface SectionData {
  readonly conversations: readonly E2eeConversation[];
  readonly profileId: string | null;
  readonly activeGroup: string | null;
  readonly onEncryptedList: boolean;
  readonly hasList: boolean;
}

function CollapsedSection({ data }: { readonly data: SectionData }) {
  const locale = useBrowserLocale();
  return (
    <nav
      aria-label={t(locale, "e2ee.section.encrypted")}
      className="tw-mb-3 tw-flex tw-flex-col tw-items-center tw-gap-1 tw-px-2"
    >
      <Link
        href={getEncryptedMessagesRoute()}
        aria-label={t(locale, "e2ee.list.entry")}
        title={t(locale, "e2ee.list.entry")}
        aria-current={data.onEncryptedList ? "page" : undefined}
        className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-emerald-500/10 tw-text-emerald-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <LockClosedIcon aria-hidden="true" className="tw-size-4" />
      </Link>
      {data.hasList ? (
        <E2eeConversationList
          conversations={data.conversations}
          selfProfileId={data.profileId}
          activeGroup={data.activeGroup}
          collapsed
          limit={SIDEBAR_LIMIT}
          label={t(locale, "e2ee.list.label")}
        />
      ) : null}
    </nav>
  );
}

function EntryLink({ data }: { readonly data: SectionData }) {
  const locale = useBrowserLocale();
  const stateClass = data.onEncryptedList
    ? "tw-bg-iron-900 tw-text-iron-50"
    : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-900/60";
  return (
    <Link
      href={getEncryptedMessagesRoute()}
      aria-current={data.onEncryptedList ? "page" : undefined}
      className={`tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${stateClass}`}
    >
      <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        <span className="tw-font-semibold">
          {t(locale, data.hasList ? "e2ee.list.viewAll" : "e2ee.list.entry")}
        </span>
        {data.hasList ? null : (
          <span className="tw-text-xs tw-text-iron-500">
            {t(locale, "e2ee.list.entryHint")}
          </span>
        )}
      </span>
      <ChevronRightIcon
        aria-hidden="true"
        className="tw-size-4 tw-flex-shrink-0"
      />
    </Link>
  );
}

function ExpandedSection({
  data,
  variant,
}: {
  readonly data: SectionData;
  readonly variant: "web" | "app";
}) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const padding = variant === "app" ? "tw-px-2" : "tw-px-4";
  const inset = variant === "app" ? "" : "tw-px-1";
  return (
    <>
      <section aria-labelledby={headingId} className="tw-mb-3">
        <div
          className={`tw-mb-1 tw-flex tw-items-center tw-justify-between tw-gap-2 ${padding}`}
        >
          <h2
            id={headingId}
            className={`tw-flex tw-items-center tw-gap-1.5 ${HEADING_CLASS}`}
          >
            <LockClosedIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-text-emerald-300"
            />
            {t(locale, "e2ee.section.encrypted")}
          </h2>
          <E2eeNewChatLink compact />
        </div>
        {data.hasList ? (
          <div className={inset}>
            <E2eeConversationList
              conversations={data.conversations}
              selfProfileId={data.profileId}
              activeGroup={data.activeGroup}
              limit={SIDEBAR_LIMIT}
              label={t(locale, "e2ee.list.label")}
            />
          </div>
        ) : null}
        <div className={inset}>
          <EntryLink data={data} />
        </div>
      </section>
      {/* Labels the existing plaintext DM list that follows this section. */}
      <h2 className={`tw-mb-1 ${HEADING_CLASS} ${padding}`}>
        {t(locale, "e2ee.section.plaintext")}
      </h2>
    </>
  );
}

interface E2eeMessagesSectionProps {
  readonly collapsed?: boolean | undefined;
  /** Spacing for the web side pane or the app's messages screen. */
  readonly variant?: "web" | "app" | undefined;
}

/**
 * "Encrypted" section above the plaintext DM list (D109). Lists encrypted
 * chats once this browser has an enrolled device; before that it is a single
 * entry into `/messages/encrypted`. Renders nothing when the build has
 * encrypted messages off, without a profile, or for proxy sessions.
 */
export function E2eeMessagesSection({
  collapsed = false,
  variant = "web",
}: E2eeMessagesSectionProps) {
  const pathname = usePathname();
  const { status, conversations, profileId } = useE2ee();

  if (status === "disabled" || status === "proxy" || status === "unavailable") {
    return null;
  }

  const data: SectionData = {
    conversations,
    profileId,
    activeGroup: getEncryptedConversationIdFromPathname(pathname),
    onEncryptedList: pathname === getEncryptedMessagesRoute(),
    hasList: status === "ready" && conversations.length > 0,
  };

  return collapsed ? (
    <CollapsedSection data={data} />
  ) : (
    <ExpandedSection data={data} variant={variant} />
  );
}
