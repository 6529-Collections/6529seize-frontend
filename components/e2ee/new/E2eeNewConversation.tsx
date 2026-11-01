"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  getEncryptedConversationRoute,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import type { UseE2eeResult } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import {
  clearE2eeComposePrefill,
  peekE2eeComposePrefill,
} from "../e2eeComposePrefill";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eePageShell } from "../ui/E2eePageShell";
import {
  E2eePeoplePicker,
  type E2eeSelectedPerson,
  toSelectedPerson,
} from "./E2eePeoplePicker";
import { useE2eeEligibility } from "./useE2eeEligibility";

const GROUP_NAME_MAX = 100;

type ChatKind = "dm" | "group";

/** A DM is exactly one other person; more people always make a group. */
function resolveChatKind(
  selectedCount: number,
  chosenKind: ChatKind | null
): ChatKind {
  if (selectedCount > 1) {
    return "group";
  }
  if (chosenKind) {
    return chosenKind;
  }
  return selectedCount === 1 ? "dm" : "group";
}

function KindOption({
  kind,
  checked,
  disabled,
  name,
  onSelect,
}: {
  readonly kind: ChatKind;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly name: string;
  readonly onSelect: (kind: ChatKind) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const labelKey: MessageKey =
    kind === "dm" ? "e2ee.new.kind.dm" : "e2ee.new.kind.group";
  const hintKey: MessageKey =
    kind === "dm" ? "e2ee.new.kind.dmHint" : "e2ee.new.kind.groupHint";
  return (
    <label
      htmlFor={id}
      className={`tw-flex tw-flex-1 tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${
        checked
          ? "tw-border-primary-400 tw-bg-primary-500/10"
          : "tw-border-iron-800 tw-bg-iron-950"
      } ${disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={kind}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(kind)}
        aria-describedby={`${id}-hint`}
        className="tw-mt-1 tw-accent-primary-500"
      />
      <span className="tw-flex tw-flex-col">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {t(locale, labelKey)}
        </span>
        <span id={`${id}-hint`} className="tw-text-xs tw-text-iron-400">
          {t(locale, hintKey)}
        </span>
      </span>
    </label>
  );
}

function NewConversationForm({ e2ee }: { readonly e2ee: UseE2eeResult }) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const nameId = useId();
  const radioName = useId();
  const [prefill] = useState(() => peekE2eeComposePrefill());
  const [selected, setSelected] = useState<readonly E2eeSelectedPerson[]>(
    () =>
      prefill?.people.filter((person) => person.profileId !== e2ee.profileId) ??
      []
  );
  const [chosenKind, setChosenKind] = useState<ChatKind | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);

  useEffect(() => {
    clearE2eeComposePrefill();
  }, []);

  const engine = e2ee.engine;
  const profileIds = selected.map((person) => person.profileId);
  const { statusFor, reasonFor, retry } = useE2eeEligibility(
    engine,
    profileIds
  );
  const kind = resolveChatKind(selected.length, chosenKind);
  const allEligible =
    selected.length > 0 &&
    profileIds.every((profileId) => statusFor(profileId) === "OK");
  const someIneligible = profileIds.some((profileId) => {
    const status = statusFor(profileId);
    return status !== "OK" && status !== "checking";
  });
  const dmPeer = kind === "dm" ? selected[0] : undefined;
  const existingDm = dmPeer && engine ? engine.findDm(dmPeer.profileId) : null;

  const onAdd = (identity: CommunityMemberMinimal) => {
    const person = toSelectedPerson(identity);
    setErrorKey(null);
    if (!person) {
      setNotice("e2ee.new.eligibility.NO_DEVICES");
      return;
    }
    if (person.profileId === e2ee.profileId) {
      setNotice("e2ee.new.self");
      return;
    }
    setNotice(null);
    setSelected((current) =>
      current.some((item) => item.profileId === person.profileId)
        ? current
        : [...current, person]
    );
  };

  const onRemove = (profileId: string) => {
    setSelected((current) =>
      current.filter((person) => person.profileId !== profileId)
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!engine || !allEligible || creating || existingDm) {
      return;
    }
    setCreating(true);
    setErrorKey(null);
    try {
      const trimmedName = name.trim();
      const g = await engine.createConversation({
        profileIds,
        kind,
        name:
          kind === "group" && selected.length > 1 && trimmedName
            ? trimmedName
            : null,
      });
      router.push(getEncryptedConversationRoute(g));
    } catch (error) {
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.new.createFailed"));
      setCreating(false);
    }
  };

  const dmPeerName = dmPeer?.handle ?? t(locale, "e2ee.unknownMember");

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="tw-mx-auto tw-flex tw-w-full tw-max-w-2xl tw-flex-col tw-gap-5 tw-px-4 tw-py-5"
      noValidate
    >
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.new.description")}
      </p>
      {prefill?.source === "dm" ? (
        <E2eeBanner tone="info" live={false}>
          {t(locale, "e2ee.new.fromDm")}
        </E2eeBanner>
      ) : null}

      <E2eePeoplePicker
        selected={selected}
        statusFor={statusFor}
        reasonFor={reasonFor}
        onRetry={retry}
        onAdd={onAdd}
        onRemove={onRemove}
        searchLabel={t(locale, "e2ee.new.searchLabel")}
        listLabel={t(locale, "e2ee.new.selected")}
      />
      <p role="status" className="tw-m-0 tw-text-sm tw-text-amber-200">
        {notice ? t(locale, notice) : null}
      </p>

      <fieldset className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-border-0 tw-p-0">
        <legend className="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          {t(locale, "e2ee.new.kindLegend")}
        </legend>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row">
          <KindOption
            kind="dm"
            name={radioName}
            checked={kind === "dm"}
            disabled={selected.length > 1}
            onSelect={setChosenKind}
          />
          <KindOption
            kind="group"
            name={radioName}
            checked={kind === "group"}
            disabled={false}
            onSelect={setChosenKind}
          />
        </div>
        {selected.length > 1 ? (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "e2ee.new.dmNeedsOne")}
          </p>
        ) : null}
      </fieldset>

      {/* A name only makes sense once there is a group to name. */}
      {kind === "group" && selected.length > 1 ? (
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
            onChange={(event) => setName(event.target.value)}
            aria-describedby={`${nameId}-hint`}
            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
          />
          <p
            id={`${nameId}-hint`}
            className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400"
          >
            {t(locale, "e2ee.new.nameHint")}
          </p>
        </div>
      ) : null}

      {existingDm ? (
        <E2eeBanner
          tone="info"
          action={
            <Link
              href={getEncryptedConversationRoute(existingDm)}
              className="tw-inline-flex tw-h-8 tw-items-center tw-rounded-lg tw-bg-white/10 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-bg-white/15 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "e2ee.new.openExisting")}
            </Link>
          }
        >
          {t(locale, "e2ee.new.existingDm", { name: dmPeerName })}
        </E2eeBanner>
      ) : null}
      {someIneligible ? (
        <E2eeBanner tone="warning">
          {t(locale, "e2ee.new.notEligibleSummary")}
        </E2eeBanner>
      ) : null}
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}

      <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
        <Link
          href={getEncryptedMessagesRoute()}
          className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.07] tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "e2ee.action.cancel")}
        </Link>
        <Button
          type="submit"
          variant="action"
          size="md"
          loading={creating}
          disabled={!allEligible || Boolean(existingDm) || !engine}
        >
          {t(locale, creating ? "e2ee.new.creating" : "e2ee.new.create")}
        </Button>
      </div>
    </form>
  );
}

/** `/messages/encrypted/new`: choose people, DM or group, optional name. */
export function E2eeNewConversation() {
  const locale = useBrowserLocale();
  return (
    <E2eePageShell
      title={t(locale, "e2ee.new.title")}
      backHref={getEncryptedMessagesRoute()}
      backLabel={t(locale, "e2ee.conversation.back")}
    >
      <E2eeRouteGate>
        {(e2ee) => <NewConversationForm e2ee={e2ee} />}
      </E2eeRouteGate>
    </E2eePageShell>
  );
}
