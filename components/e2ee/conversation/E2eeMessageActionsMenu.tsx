"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowUturnLeftIcon,
  BellIcon,
  BellSlashIcon,
  ChatBubbleLeftEllipsisIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  FaceSmileIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeMessage } from "@/lib/e2ee/types";
import { E2eeEmojiPicker } from "./E2eeEmojiPicker";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "🎉"] as const;

export interface E2eeMessageActions {
  readonly onReply: (message: E2eeMessage) => void;
  readonly onEdit: (message: E2eeMessage) => void;
  readonly onDelete: (message: E2eeMessage) => void;
  readonly onReport: (message: E2eeMessage) => void;
  /** Block the sender (Block, mute and DM settings come before Report). */
  readonly onBlock: (message: E2eeMessage) => void;
  readonly onToggleMute: () => void;
  /** Whether this chat is muted on this device. */
  readonly muted: boolean;
  readonly onReact: (
    message: E2eeMessage,
    reaction: string,
    on: boolean
  ) => void;
  readonly onJumpTo: (id: string) => void;
}

function ActionMenuItem({
  onClick,
  icon,
  children,
  tone = "default",
}: {
  readonly onClick: () => void;
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly tone?: "default" | "danger" | undefined;
}) {
  return (
    <MenuItem>
      <button
        type="button"
        onClick={onClick}
        className={`tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400 ${
          tone === "danger" ? "tw-text-rose-300" : "tw-text-iron-100"
        }`}
      >
        {icon}
        {children}
      </button>
    </MenuItem>
  );
}

const MENU_ITEM_CLASS =
  "tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 tw-no-underline data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400";

/**
 * Everyday tools for someone else's message: mute, block and who can
 * message you come first; reporting is for severe or illegal harm only.
 */
function SafetyMenuItems({
  message,
  senderName,
  actions,
  iconClass,
}: {
  readonly message: E2eeMessage;
  readonly senderName: string;
  readonly actions: E2eeMessageActions;
  readonly iconClass: string;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <ActionMenuItem
        onClick={actions.onToggleMute}
        icon={
          actions.muted ? (
            <BellIcon aria-hidden="true" className={iconClass} />
          ) : (
            <BellSlashIcon aria-hidden="true" className={iconClass} />
          )
        }
      >
        {t(locale, actions.muted ? "e2ee.message.unmute" : "e2ee.message.mute")}
      </ActionMenuItem>
      {message.senderProfileId ? (
        <ActionMenuItem
          onClick={() => actions.onBlock(message)}
          icon={<NoSymbolIcon aria-hidden="true" className={iconClass} />}
        >
          {t(locale, "e2ee.message.block", { name: senderName })}
        </ActionMenuItem>
      ) : null}
      <MenuItem>
        <Link href="/preferences" className={MENU_ITEM_CLASS}>
          <ChatBubbleLeftEllipsisIcon
            aria-hidden="true"
            className={iconClass}
          />
          {t(locale, "e2ee.message.messageSettings")}
        </Link>
      </MenuItem>
      <ActionMenuItem
        tone="danger"
        onClick={() => actions.onReport(message)}
        icon={<FlagIcon aria-hidden="true" className={iconClass} />}
      >
        {t(locale, "e2ee.message.report")}
      </ActionMenuItem>
    </>
  );
}

export function E2eeMessageActionsMenu({
  canAct = true,
  message,
  isOwn,
  selfProfileId,
  senderName,
  actions,
}: {
  readonly canAct?: boolean;
  readonly message: E2eeMessage;
  readonly isOwn: boolean;
  readonly selfProfileId: string | null;
  readonly senderName: string;
  readonly actions: E2eeMessageActions;
}) {
  const locale = useBrowserLocale();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const iconClass = "tw-size-4 tw-flex-shrink-0";
  return (
    <>
      <E2eeEmojiPicker
        open={canAct && emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onSelect={(reaction) =>
          actions.onReact(
            message,
            reaction,
            !(
              selfProfileId !== null &&
              (message.reactions[reaction] ?? []).includes(selfProfileId)
            )
          )
        }
      />
      <Menu>
        <MenuButton
          aria-label={t(locale, "e2ee.message.actions")}
          className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-300 tw-opacity-100 tw-transition-opacity data-[open]:tw-opacity-100 hover:tw-text-iron-50 focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:tw-opacity-0 desktop-hover:group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:-tw-mr-2 touch-only:-tw-mt-2 touch-only:tw-size-11 touch-only:tw-bg-transparent touch-only:tw-text-iron-500 touch-only:tw-opacity-100"
        >
          <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          className="tailwind-scope tw-z-[1001] tw-mt-1 tw-w-56 tw-rounded-xl tw-bg-iron-950 tw-p-1.5 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none"
        >
          {canAct && (
            <>
              <div className="tw-flex tw-justify-between tw-gap-1 tw-px-1 tw-pb-1">
                {QUICK_REACTIONS.map((reaction) => {
                  const mine =
                    selfProfileId !== null &&
                    (message.reactions[reaction] ?? []).includes(selfProfileId);
                  return (
                    <MenuItem key={reaction}>
                      <button
                        type="button"
                        onClick={() =>
                          actions.onReact(message, reaction, !mine)
                        }
                        aria-pressed={mine}
                        aria-label={t(locale, "e2ee.message.reactWith", {
                          reaction,
                        })}
                        className={`tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-base data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400 ${
                          mine ? "tw-ring-1 tw-ring-iron-700" : ""
                        }`}
                      >
                        <span aria-hidden="true">{reaction}</span>
                      </button>
                    </MenuItem>
                  );
                })}
              </div>
              <ActionMenuItem
                onClick={() => setEmojiOpen(true)}
                icon={
                  <FaceSmileIcon aria-hidden="true" className={iconClass} />
                }
              >
                {t(locale, "e2ee.emoji.react")}
              </ActionMenuItem>
              <ActionMenuItem
                onClick={() => actions.onReply(message)}
                icon={
                  <ArrowUturnLeftIcon
                    aria-hidden="true"
                    className={iconClass}
                  />
                }
              >
                {t(locale, "e2ee.message.reply")}
              </ActionMenuItem>
            </>
          )}
          {isOwn && canAct ? (
            <>
              <ActionMenuItem
                onClick={() => actions.onEdit(message)}
                icon={
                  <PencilSquareIcon aria-hidden="true" className={iconClass} />
                }
              >
                {t(locale, "e2ee.message.edit")}
              </ActionMenuItem>
              <ActionMenuItem
                tone="danger"
                onClick={() => actions.onDelete(message)}
                icon={<TrashIcon aria-hidden="true" className={iconClass} />}
              >
                {t(locale, "e2ee.message.delete")}
              </ActionMenuItem>
            </>
          ) : null}
          {!isOwn && (
            <SafetyMenuItems
              message={message}
              senderName={senderName}
              actions={actions}
              iconClass={iconClass}
            />
          )}
        </MenuItems>
      </Menu>
    </>
  );
}
