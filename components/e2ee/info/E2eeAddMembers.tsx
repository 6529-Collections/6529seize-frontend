"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEligibility,
  E2eeEngine,
} from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import {
  E2eePeoplePicker,
  type E2eeSelectedPerson,
  toSelectedPerson,
} from "../new/E2eePeoplePicker";
import { useE2eeEligibility } from "../new/useE2eeEligibility";

const SKIPPED_KEYS: Record<
  Exclude<E2eeEligibility["status"], "OK">,
  MessageKey
> = {
  POLICY: "e2ee.new.eligibility.POLICY",
  BLOCKED: "e2ee.new.eligibility.BLOCKED",
  NO_DEVICES: "e2ee.new.eligibility.NO_DEVICES",
};

interface E2eeAddMembersProps {
  readonly engine: E2eeEngine;
  readonly conversation: E2eeConversation;
}

/** Admins add people to a group; each person's eligibility is shown first. */
export function E2eeAddMembers({ engine, conversation }: E2eeAddMembersProps) {
  const locale = useBrowserLocale();
  const [selected, setSelected] = useState<readonly E2eeSelectedPerson[]>([]);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [skipped, setSkipped] = useState<
    readonly { readonly name: string; readonly key: MessageKey }[]
  >([]);
  const profileIds = selected.map((person) => person.profileId);
  const { statusFor, retry } = useE2eeEligibility(engine, profileIds);
  const memberIds = new Set(
    conversation.members.map((member) => member.profileId)
  );
  const canSubmit =
    selected.length > 0 &&
    profileIds.every((profileId) => statusFor(profileId) === "OK");

  const onAdd = (identity: CommunityMemberMinimal) => {
    const person = toSelectedPerson(identity);
    if (!person || memberIds.has(person.profileId)) {
      return;
    }
    setSelected((current) =>
      current.some((item) => item.profileId === person.profileId)
        ? current
        : [...current, person]
    );
  };

  const submit = async () => {
    setPending(true);
    setErrorKey(null);
    setSkipped([]);
    try {
      const results = await engine.addMembers(conversation.g, profileIds);
      const notAdded = results.filter((result) => result.status !== "OK");
      setSkipped(
        notAdded.map((result) => ({
          name:
            selected.find((person) => person.profileId === result.profileId)
              ?.handle ?? t(locale, "e2ee.unknownMember"),
          key:
            result.status === "OK"
              ? "e2ee.new.eligibility.OK"
              : SKIPPED_KEYS[result.status],
        }))
      );
      setSelected([]);
    } catch (error) {
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.info.addFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <E2eePeoplePicker
        selected={selected}
        statusFor={statusFor}
        onRetry={retry}
        onAdd={onAdd}
        onRemove={(profileId) =>
          setSelected((current) =>
            current.filter((person) => person.profileId !== profileId)
          )
        }
        searchLabel={t(locale, "e2ee.info.addSearch")}
        listLabel={t(locale, "e2ee.info.addPeople")}
      />
      <div className="tw-flex tw-justify-end">
        <Button
          variant="action"
          size="sm"
          onClick={() => void submit()}
          loading={pending}
          disabled={!canSubmit}
        >
          {t(locale, "e2ee.info.addSubmit")}
        </Button>
      </div>
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
      {skipped.length > 0 ? (
        <div role="status" className="tw-text-sm tw-text-amber-100">
          <p className="tw-m-0">{t(locale, "e2ee.info.addSkipped")}</p>
          <ul className="tw-m-0 tw-mt-1 tw-pl-5">
            {skipped.map((item) => (
              <li key={item.name}>
                {t(locale, "e2ee.info.addSkippedItem", {
                  name: item.name,
                  reason: t(locale, item.key),
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
