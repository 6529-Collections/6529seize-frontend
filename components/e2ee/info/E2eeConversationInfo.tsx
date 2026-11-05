"use client";

import {
  BellIcon,
  BellSlashIcon,
  CheckBadgeIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { type FormEvent, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMember,
} from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import {
  formatE2eeWallet,
  formatSafetyCode,
  getMemberName,
  tCount,
} from "../e2eeFormat";
import { setE2eeChatMuted, useMutedE2eeChats } from "../e2eeMutedChats";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { E2eeDialog } from "../ui/E2eeDialog";
import { E2eeAddMembers } from "./E2eeAddMembers";

const GROUP_NAME_MAX = 100;

/** One translatable line per device: label, check status and wallet. */
function deviceLine(
  locale: SupportedLocale,
  device: E2eeMember["devices"][number]
): string {
  const params = {
    device: device.label,
    status: t(
      locale,
      device.verified ? "e2ee.devices.verified" : "e2ee.devices.unverified"
    ),
  };
  const wallet = formatE2eeWallet(device.wallet);
  return wallet
    ? t(locale, "e2ee.info.deviceLine", { ...params, wallet })
    : t(locale, "e2ee.info.deviceLineNoWallet", params);
}

const SECTION_HEADING =
  "tw-m-0 tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-200";

function SafetyCode({ code }: { readonly code: string }) {
  const locale = useBrowserLocale();
  const groups = formatSafetyCode(code);
  return (
    <section>
      <h3 className={SECTION_HEADING}>{t(locale, "e2ee.info.safetyCode")}</h3>
      <p className="tw-m-0">
        <span className="tw-sr-only">
          {t(locale, "e2ee.info.safetyCodeAria", { code: groups.join(" ") })}
        </span>
        <span
          aria-hidden="true"
          className="tw-flex tw-flex-wrap tw-gap-2 tw-font-mono tw-text-lg tw-tracking-wider tw-text-iron-50"
        >
          {groups.map((group, index) => (
            // Positions are fixed: four groups of four characters.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key fixed positions in a code that never reorders.
            <span
              key={`${index}-${group}`}
              className="tw-rounded-md tw-bg-iron-900 tw-px-2 tw-py-1"
            >
              {group}
            </span>
          ))}
        </span>
      </p>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "e2ee.info.safetyCodeHelp")}
      </p>
    </section>
  );
}

const ENCRYPTION_POINTS: readonly {
  readonly key: MessageKey;
  readonly Icon: typeof LockClosedIcon;
}[] = [
  { key: "e2ee.info.encryption.mls", Icon: LockClosedIcon },
  { key: "e2ee.info.encryption.postQuantum", Icon: KeyIcon },
  { key: "e2ee.info.encryption.devices", Icon: DevicePhoneMobileIcon },
];

/** What protects this chat, in plain words, without overclaiming. */
function EncryptionDetails() {
  const locale = useBrowserLocale();
  return (
    <section>
      <h3 className={SECTION_HEADING}>
        {t(locale, "e2ee.info.encryption.title")}
      </h3>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {ENCRYPTION_POINTS.map(({ key, Icon }) => (
          <li
            key={key}
            className="tw-flex tw-items-start tw-gap-2 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            <Icon
              aria-hidden="true"
              className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
            />
            <span>{t(locale, key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Mute is a device-local setting, so the label says so. */
function MuteSetting({
  g,
  selfProfileId,
}: {
  readonly g: string;
  readonly selfProfileId: string | null;
}) {
  const locale = useBrowserLocale();
  const muted = useMutedE2eeChats(selfProfileId).has(g);
  if (!selfProfileId) {
    return null;
  }
  const Icon = muted ? BellIcon : BellSlashIcon;
  return (
    <section>
      <h3 className={SECTION_HEADING}>
        {t(locale, "e2ee.info.notifications")}
      </h3>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setE2eeChatMuted(selfProfileId, g, !muted)}
      >
        <Icon aria-hidden="true" className="tw-size-4" />
        {t(locale, muted ? "e2ee.info.unmute" : "e2ee.info.mute")}
      </Button>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "e2ee.info.muteHelp")}
      </p>
    </section>
  );
}

function RenameForm({
  engine,
  conversation,
}: {
  readonly engine: E2eeEngine;
  readonly conversation: E2eeConversation;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const value = draft ?? conversation.name ?? "";
  const trimmed = value.trim();
  const unchanged = trimmed === (conversation.name ?? "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || unchanged) {
      return;
    }
    setPending(true);
    setErrorKey(null);
    try {
      await engine.rename(conversation.g, trimmed);
      setDraft(null);
    } catch (error) {
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.info.actionFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="tw-flex tw-flex-col tw-gap-2"
    >
      <label htmlFor={inputId} className={SECTION_HEADING}>
        {t(locale, "e2ee.info.renameLabel")}
      </label>
      <div className="tw-flex tw-gap-2">
        <input
          id={inputId}
          value={value}
          maxLength={GROUP_NAME_MAX}
          onChange={(event) => setDraft(event.target.value)}
          className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        />
        <Button
          type="submit"
          variant="secondary"
          size="md"
          loading={pending}
          disabled={!trimmed || unchanged}
        >
          {t(locale, "e2ee.info.renameSave")}
        </Button>
      </div>
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
    </form>
  );
}

type PendingMemberAction =
  | { readonly kind: "remove"; readonly member: E2eeMember }
  | { readonly kind: "leave" };

function MemberRow({
  member,
  conversation,
  selfProfileId,
  canManage,
  onSetAdmin,
  onRemove,
}: {
  readonly member: E2eeMember;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly canManage: boolean;
  readonly onSetAdmin: (member: E2eeMember, admin: boolean) => void;
  readonly onRemove: (member: E2eeMember) => void;
}) {
  const locale = useBrowserLocale();
  const name = getMemberName(
    locale,
    conversation.members,
    member.profileId,
    selfProfileId
  );
  const isSelf = member.profileId === selfProfileId;
  const isAdmin =
    member.isAdmin || conversation.admins.includes(member.profileId);
  return (
    <li className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <E2eeAvatar pfp={member.pfp} name={member.handle ?? name} size="sm" />
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
          {name}
        </span>
        {isAdmin ? (
          <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-300">
            {t(locale, "e2ee.info.admin")}
          </span>
        ) : null}
      </div>
      <details className="tw-text-xs tw-text-iron-400">
        <summary className="tw-cursor-pointer tw-rounded focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          <span className="tw-sr-only">
            {t(locale, "e2ee.info.memberDevices", { name })}{" "}
          </span>
          {tCount(
            locale,
            { one: "e2ee.info.devices.one", other: "e2ee.info.devices.other" },
            member.devices.length
          )}
        </summary>
        <ul className="tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0 tw-pl-4">
          {member.devices.map((device) => (
            <li
              key={device.deviceKey}
              className="tw-flex tw-items-start tw-gap-1.5"
            >
              {device.verified ? (
                <CheckBadgeIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-text-emerald-300"
                />
              ) : (
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-text-amber-200"
                />
              )}
              <span
                className="tw-text-iron-300"
                title={device.wallet ?? undefined}
              >
                {deviceLine(locale, device)}
              </span>
            </li>
          ))}
        </ul>
      </details>
      {canManage && !isSelf ? (
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onSetAdmin(member, !isAdmin)}
            aria-label={t(
              locale,
              isAdmin ? "e2ee.info.removeAdminAria" : "e2ee.info.makeAdminAria",
              { name }
            )}
          >
            {t(
              locale,
              isAdmin ? "e2ee.info.removeAdmin" : "e2ee.info.makeAdmin"
            )}
          </Button>
          <Button
            variant="destructiveOutline"
            size="xs"
            onClick={() => onRemove(member)}
            aria-label={t(locale, "e2ee.info.removeAria", { name })}
          >
            {t(locale, "e2ee.info.remove")}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

interface E2eeConversationInfoProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
}

/** Members, admin actions, safety code, report help and leave. */
export function E2eeConversationInfo({
  open,
  onClose,
  conversation,
  engine,
  selfProfileId,
}: E2eeConversationInfoProps) {
  const locale = useBrowserLocale();
  const [pendingAction, setPendingAction] =
    useState<PendingMemberAction | null>(null);
  const [actionErrorKey, setActionErrorKey] = useState<MessageKey | null>(null);
  const isGroup = conversation.kind === "group";
  const isActive = conversation.status === "active";
  const isAdmin =
    selfProfileId !== null && conversation.admins.includes(selfProfileId);
  const canManage = isGroup && isAdmin && isActive;

  const setAdmin = async (member: E2eeMember, admin: boolean) => {
    setActionErrorKey(null);
    try {
      await engine.setAdmin(conversation.g, member.profileId, admin);
    } catch (error) {
      setActionErrorKey(getE2eeActionErrorKey(error, "e2ee.info.actionFailed"));
    }
  };

  const confirmName =
    pendingAction?.kind === "remove"
      ? getMemberName(
          locale,
          conversation.members,
          pendingAction.member.profileId,
          selfProfileId
        )
      : "";

  return (
    <E2eeDialog
      open={open}
      onClose={onClose}
      size="md"
      title={t(locale, "e2ee.info.title")}
      closeLabel={t(locale, "e2ee.info.close")}
      description={
        <span className="tw-flex tw-items-start tw-gap-2">
          <ShieldCheckIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-emerald-300"
          />
          <span className="tw-flex tw-flex-col">
            <span className="tw-font-semibold tw-text-iron-200">
              {t(
                locale,
                isGroup ? "e2ee.info.kind.group" : "e2ee.info.kind.dm"
              )}
            </span>
            <span>{t(locale, "e2ee.info.encryptedNote")}</span>
          </span>
        </span>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-6">
        {canManage ? (
          <RenameForm engine={engine} conversation={conversation} />
        ) : null}

        <section>
          <div className="tw-mb-2 tw-flex tw-items-baseline tw-justify-between tw-gap-2">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
              {t(locale, "e2ee.info.members")}
            </h3>
            <span className="tw-text-xs tw-text-iron-500">
              {tCount(
                locale,
                {
                  one: "e2ee.conversation.members.one",
                  other: "e2ee.conversation.members.other",
                },
                conversation.members.length
              )}
            </span>
          </div>
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
            {conversation.members.map((member) => (
              <MemberRow
                key={member.profileId}
                member={member}
                conversation={conversation}
                selfProfileId={selfProfileId}
                canManage={canManage}
                onSetAdmin={(target, admin) => void setAdmin(target, admin)}
                onRemove={(target) =>
                  setPendingAction({ kind: "remove", member: target })
                }
              />
            ))}
          </ul>
          {actionErrorKey ? (
            <p
              role="alert"
              className="tw-m-0 tw-mt-2 tw-text-sm tw-text-rose-300"
            >
              {t(locale, actionErrorKey)}
            </p>
          ) : null}
        </section>

        {canManage ? (
          <section>
            <h3 className={SECTION_HEADING}>
              {t(locale, "e2ee.info.addPeople")}
            </h3>
            <E2eeAddMembers engine={engine} conversation={conversation} />
          </section>
        ) : null}

        <MuteSetting g={conversation.g} selfProfileId={selfProfileId} />

        <SafetyCode code={conversation.safetyCode} />

        <EncryptionDetails />

        <section>
          <h3 className={SECTION_HEADING}>{t(locale, "e2ee.info.report")}</h3>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "e2ee.info.reportHelp")}
          </p>
        </section>

        {isActive ? (
          <div>
            <Button
              variant="destructiveOutline"
              size="md"
              onClick={() => setPendingAction({ kind: "leave" })}
            >
              {t(locale, "e2ee.info.leave")}
            </Button>
          </div>
        ) : null}
      </div>

      <E2eeConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.kind === "remove"
            ? t(locale, "e2ee.info.removeConfirmTitle", { name: confirmName })
            : t(locale, "e2ee.info.leaveConfirmTitle")
        }
        body={t(
          locale,
          pendingAction?.kind === "remove"
            ? "e2ee.info.removeConfirmBody"
            : "e2ee.info.leaveConfirmBody"
        )}
        confirmLabel={t(
          locale,
          pendingAction?.kind === "remove"
            ? "e2ee.info.remove"
            : "e2ee.info.leave"
        )}
        onConfirm={async () => {
          if (pendingAction?.kind === "remove") {
            await engine.removeMember(
              conversation.g,
              pendingAction.member.profileId
            );
          } else if (pendingAction?.kind === "leave") {
            await engine.leave(conversation.g);
            onClose();
          }
        }}
        onClose={() => setPendingAction(null)}
      />
    </E2eeDialog>
  );
}
