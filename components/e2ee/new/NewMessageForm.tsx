"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import type { UseE2eeResult } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useE2eeContext } from "../E2eeContext";
import { getE2eeActionErrorKey, getE2eeErrorCode } from "../e2eeErrors";
import { E2eeGateState } from "../gate/E2eeRouteGate";
import { hasExactMembers } from "../legacy/encryptedEquivalent";
import { isLegacyDmClosed } from "../legacy/legacyDmRetention";
import { E2eeBanner } from "../ui/E2eeBanner";
import { useE2eeNow } from "../useE2eeNow";
import { ExistingGroupChoices } from "./ExistingGroupChoices";
import { type E2eeSelectedPerson, toSelectedPerson } from "./E2eePeoplePicker";
import { MessageRecipients } from "./MessageRecipients";
import {
  NewMessageActions,
  type NewMessageAlternateAction,
} from "./NewMessageActions";
import {
  type E2eeEligibilityState,
  useE2eeEligibility,
} from "./useE2eeEligibility";

const GROUP_NAME_MAX = 100;

const EMPTY_RECIPIENTS: readonly E2eeSelectedPerson[] = [];
interface MessageChoice {
  readonly forceGroup: boolean;
  readonly preferNewGroup: boolean;
  readonly chosenGroup: string | null;
  readonly preferUnencrypted: boolean;
}

const DEFAULT_CHOICE: MessageChoice = {
  forceGroup: false,
  preferNewGroup: false,
  chosenGroup: null,
  preferUnencrypted: false,
};

interface NewMessageFormProps {
  readonly e2ee: UseE2eeResult;
  readonly selfProfileId?: string | undefined;
  readonly initialPeople?: readonly E2eeSelectedPerson[] | undefined;
  readonly fromLegacyChat?: boolean | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly onOpen?: (() => void) | undefined;
  readonly createUnencrypted?:
    | ((wallets: string[]) => Promise<boolean>)
    | undefined;
}

function resolveExistingChat(
  e2ee: UseE2eeResult,
  profileIds: string[],
  kind: "dm" | "group",
  choice: MessageChoice
) {
  const { engine, profileId } = e2ee;
  if (!engine || !profileId || e2ee.status !== "ready") {
    return {
      matchingGroups: [],
      showMatches: false,
      existing: null,
      openingExisting: false,
    };
  }
  if (kind === "dm") {
    const peer = profileIds[0];
    const existing = peer ? engine.findDm(peer) : null;
    return {
      matchingGroups: [],
      showMatches: false,
      existing,
      openingExisting: Boolean(existing),
    };
  }

  const members = new Set([profileId, ...profileIds]);
  const matchingGroups = e2ee.conversations.filter(
    (chat) =>
      chat.kind === "group" &&
      chat.status === "active" &&
      !chat.splitView &&
      hasExactMembers(chat, members)
  );
  const showMatches = !choice.preferNewGroup && matchingGroups.length > 0;
  const existingGroup =
    matchingGroups.length === 1 && choice.chosenGroup === null
      ? matchingGroups[0]
      : matchingGroups.find((chat) => chat.g === choice.chosenGroup);

  return {
    matchingGroups,
    showMatches,
    existing: showMatches ? existingGroup?.g : null,
    openingExisting: showMatches,
  };
}

function canContinueUnencrypted({
  legacyOpen,
  openingExisting,
  selectedCount,
  walletCount,
  status,
  statuses,
}: {
  readonly legacyOpen: boolean;
  readonly openingExisting: boolean;
  readonly selectedCount: number;
  readonly walletCount: number;
  readonly status: UseE2eeResult["status"];
  readonly statuses: readonly E2eeEligibilityState[];
}) {
  if (
    !legacyOpen ||
    openingExisting ||
    selectedCount === 0 ||
    selectedCount !== walletCount
  )
    return false;
  if (["idle", "loading", "enrolling"].includes(status)) return false;
  if (status !== "ready") return true;
  return (
    statuses.includes("NO_DEVICES") &&
    statuses.every((value) => value === "OK" || value === "NO_DEVICES")
  );
}

function getMessageAction({
  openingExisting,
  useUnencrypted,
  hasUnavailable,
  legacyClosedForDm,
}: {
  readonly openingExisting: boolean;
  readonly useUnencrypted: boolean;
  readonly hasUnavailable: boolean;
  readonly legacyClosedForDm: boolean;
}): {
  readonly actionLabel: MessageKey;
  readonly warning: "blocked" | "closed" | "retention" | null;
} {
  if (openingExisting)
    return { actionLabel: "e2ee.new.openExisting", warning: null };
  if (useUnencrypted)
    return {
      actionLabel: "e2ee.new.continueUnencrypted",
      warning: "retention",
    };
  if (legacyClosedForDm)
    return { actionLabel: "e2ee.new.start", warning: "closed" };
  return {
    actionLabel: "e2ee.new.start",
    warning: hasUnavailable ? "blocked" : null,
  };
}

function getAlternateActions({
  hasMatches,
  showMatches,
  showLegacyChoice,
  useUnencrypted,
  choice,
  setChoice,
}: {
  readonly hasMatches: boolean;
  readonly showMatches: boolean;
  readonly showLegacyChoice: boolean;
  readonly useUnencrypted: boolean;
  readonly choice: MessageChoice;
  readonly setChoice: (choice: MessageChoice) => void;
}): NewMessageAlternateAction[] {
  const actions: NewMessageAlternateAction[] = [];
  if (hasMatches) {
    actions.push({
      kind: "group",
      label: showMatches ? "e2ee.new.newGroup" : "e2ee.new.viewGroups",
      onClick: () =>
        setChoice({
          ...choice,
          preferNewGroup: showMatches,
          preferUnencrypted: false,
        }),
    });
  }
  if (showLegacyChoice) {
    actions.push({
      kind: "encryption",
      label: useUnencrypted
        ? "e2ee.new.useEncrypted"
        : "e2ee.new.useUnencrypted",
      onClick: () =>
        setChoice({ ...choice, preferUnencrypted: !choice.preferUnencrypted }),
    });
  }
  return actions;
}

export function NewMessageForm({
  e2ee,
  selfProfileId = e2ee.profileId ?? undefined,
  initialPeople = EMPTY_RECIPIENTS,
  fromLegacyChat = false,
  onCancel,
  onOpen,
  createUnencrypted,
}: NewMessageFormProps) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const { requestEngine } = useE2eeContext();
  const now = useE2eeNow();
  const nameId = useId();
  const sending = useRef(false);
  const [selected, setSelected] = useState(() =>
    initialPeople.filter((person) => person.profileId !== selfProfileId)
  );
  const [choice, setChoice] = useState(DEFAULT_CHOICE);
  const { forceGroup, chosenGroup, preferUnencrypted } = choice;
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);

  const hasRecipients = selected.length > 0;

  const engine = e2ee.status === "ready" ? e2ee.engine : null;
  const profileIds = selected.map((person) => person.profileId);
  const eligibility = useE2eeEligibility(engine, profileIds);
  const statuses = profileIds.map(eligibility.statusFor);
  const allEligible =
    statuses.length > 0 && statuses.every((status) => status === "OK");
  const hasUnavailable = statuses.some(
    (status) =>
      status === "NO_DEVICES" || status === "POLICY" || status === "BLOCKED"
  );
  const kind = selected.length > 1 || forceGroup ? "group" : "dm";
  const { matchingGroups, showMatches, existing, openingExisting } =
    resolveExistingChat(e2ee, profileIds, kind, choice);
  const wallets = selected.flatMap((person) =>
    person.wallet ? [person.wallet] : []
  );
  const legacyClosed =
    Boolean(createUnencrypted) && now > 0 && isLegacyDmClosed(now);
  const canUseUnencrypted = canContinueUnencrypted({
    legacyOpen: Boolean(createUnencrypted) && now > 0 && !legacyClosed,
    openingExisting,
    selectedCount: selected.length,
    walletCount: wallets.length,
    status: e2ee.status,
    statuses,
  });
  const showLegacyChoice = canUseUnencrypted && selected.length > 1;
  const useUnencrypted =
    canUseUnencrypted &&
    (preferUnencrypted || (kind === "dm" && !showLegacyChoice));
  const showGroupName = selected.length > 1 && !showMatches && !useUnencrypted;
  const canSubmit =
    !creating &&
    (openingExisting ? Boolean(existing) : useUnencrypted || allEligible);

  const resetAction = () => {
    setChoice({ ...DEFAULT_CHOICE, forceGroup });
    setErrorKey(null);
    setNotice(null);
  };

  const onAdd = (identity: CommunityMemberMinimal) => {
    if (sending.current) return;
    const person = toSelectedPerson(identity);
    if (!person) {
      setNotice("e2ee.new.eligibility.NO_DEVICES");
      return;
    }
    if (person.profileId === selfProfileId) {
      setNotice("e2ee.new.self");
      return;
    }
    if (e2ee.status === "idle") requestEngine();
    resetAction();
    setSelected((current) =>
      current.some((item) => item.profileId === person.profileId)
        ? current
        : [...current, person]
    );
  };

  const onRemove = (profileId: string) => {
    if (sending.current) return;
    resetAction();
    setSelected((current) =>
      current.filter((person) => person.profileId !== profileId)
    );
  };

  const openChat = (g: string) => {
    onOpen?.();
    router.push(getEncryptedConversationRoute(g));
  };

  const submit = async () => {
    if (!canSubmit || sending.current) return;
    if (existing) {
      openChat(existing);
      return;
    }
    sending.current = true;
    setCreating(true);
    setErrorKey(null);
    try {
      if (useUnencrypted && createUnencrypted) {
        // The displayed eligibility can predate the cutoff at the time of the click.
        if (!isLegacyDmClosed()) await createUnencrypted(wallets);
        return;
      }
      if (engine && allEligible) {
        const g = await engine.createConversation({
          profileIds,
          kind,
          name: showGroupName ? name.trim() || null : null,
          requireAllRecipients: true,
        });
        openChat(g);
      }
    } catch (error) {
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.new.createFailed"));
      const code = getE2eeErrorCode(error);
      if (
        code === "E2EE_POLICY" ||
        code === "E2EE_BLOCKED" ||
        code === "E2EE_NO_DEVICES"
      ) {
        profileIds.forEach(eligibility.retry);
      }
    } finally {
      sending.current = false;
      setCreating(false);
    }
  };

  const { actionLabel, warning } = getMessageAction({
    openingExisting,
    useUnencrypted,
    hasUnavailable,
    legacyClosedForDm:
      legacyClosed && kind === "dm" && statuses.includes("NO_DEVICES"),
  });
  const alternateActions = getAlternateActions({
    hasMatches: matchingGroups.length > 0,
    showMatches,
    showLegacyChoice,
    useUnencrypted,
    choice,
    setChoice,
  });

  return (
    <form
      aria-label={t(locale, "quickDm.createModalTitle")}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="tw-mx-auto tw-flex tw-min-h-0 tw-w-full tw-max-w-2xl tw-flex-1 tw-flex-col"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-4">
        {fromLegacyChat && (
          <E2eeBanner tone="info" live={false}>
            {t(locale, "e2ee.new.fromDm")}
          </E2eeBanner>
        )}
        <MessageRecipients
          selected={selected}
          eligibility={engine ? eligibility : null}
          onAdd={onAdd}
          onRemove={onRemove}
          disabled={creating}
        />
        {notice && (
          <output className="tw-block tw-text-sm tw-text-amber-200">
            {t(locale, notice)}
          </output>
        )}
        {!engine && hasRecipients && <E2eeGateState e2ee={e2ee} />}
        {showMatches && (
          <ExistingGroupChoices
            groups={matchingGroups}
            chosenGroup={chosenGroup}
            onChoose={(groupId) =>
              setChoice({ ...choice, chosenGroup: groupId })
            }
            selfProfileId={e2ee.profileId}
          />
        )}
        {showGroupName && (
          <div>
            <label
              htmlFor={nameId}
              className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
            >
              {t(locale, "e2ee.new.nameLabel")}
            </label>
            <input
              id={nameId}
              value={name}
              maxLength={GROUP_NAME_MAX}
              disabled={creating}
              onChange={(event) => setName(event.target.value)}
              aria-describedby={nameId + "-hint"}
              className="tw-mt-1 tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-base tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-text-sm"
            />
            <p
              id={nameId + "-hint"}
              className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400"
            >
              {t(locale, "e2ee.new.nameHint")}
            </p>
          </div>
        )}
        {selected.length === 1 && engine && (
          <details className="tw-text-sm tw-text-iron-300">
            <summary className="tw-w-fit tw-cursor-pointer tw-rounded-md focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
              {t(locale, "e2ee.new.moreOptions")}
            </summary>
            <label className="tw-mt-2 tw-flex tw-min-h-11 tw-w-fit tw-items-center tw-gap-2">
              <input
                type="checkbox"
                checked={forceGroup}
                disabled={creating}
                onChange={(event) => {
                  resetAction();
                  setChoice({
                    ...DEFAULT_CHOICE,
                    forceGroup: event.target.checked,
                  });
                }}
                className="tw-accent-primary-500"
              />
              {t(locale, "e2ee.new.forceGroup")}
            </label>
          </details>
        )}
      </div>
      <NewMessageActions
        actionLabel={actionLabel}
        canSubmit={canSubmit}
        creating={creating}
        encrypted={allEligible || openingExisting}
        errorKey={errorKey}
        warning={warning}
        alternateActions={alternateActions}
        onCancel={onCancel}
      />
    </form>
  );
}
