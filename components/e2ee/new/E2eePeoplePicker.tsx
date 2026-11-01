"use client";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import GroupCreateIdentitiesSearch from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeEligibilityReason } from "@/lib/e2ee/types";
import type { E2eePrefillPerson } from "../e2eeComposePrefill";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { getE2eeEligibilityKey } from "./eligibilityCopy";
import type { E2eeEligibilityState } from "./useE2eeEligibility";

export type E2eeSelectedPerson = E2eePrefillPerson;

export const toSelectedPerson = (
  identity: CommunityMemberMinimal
): E2eeSelectedPerson | null =>
  identity.profile_id
    ? {
        profileId: identity.profile_id,
        handle: identity.handle,
        pfp: identity.pfp,
        wallet: (identity.primary_wallet ?? identity.wallet).toLowerCase(),
      }
    : null;

function EligibilityStatus({
  status,
  reason,
  onRetry,
}: {
  readonly status: E2eeEligibilityState;
  readonly reason: E2eeEligibilityReason | null;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  const label = t(locale, getE2eeEligibilityKey(status, reason));
  if (status === "checking") {
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
        <CircleLoader />
        {label}
      </span>
    );
  }
  if (status === "OK") {
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-emerald-300">
        <CheckCircleIcon aria-hidden="true" className="tw-size-4" />
        {label}
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-amber-200 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <ExclamationCircleIcon aria-hidden="true" className="tw-size-4" />
        {label}
      </button>
    );
  }
  const Icon = status === "BLOCKED" ? NoSymbolIcon : ExclamationCircleIcon;
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-rose-300">
      <Icon aria-hidden="true" className="tw-size-4" />
      {label}
    </span>
  );
}

interface E2eePeoplePickerProps {
  readonly selected: readonly E2eeSelectedPerson[];
  readonly statusFor: (profileId: string) => E2eeEligibilityState;
  readonly reasonFor?:
    | ((profileId: string) => E2eeEligibilityReason | null)
    | undefined;
  readonly onRetry: (profileId: string) => void;
  readonly onAdd: (identity: CommunityMemberMinimal) => void;
  readonly onRemove: (profileId: string) => void;
  readonly searchLabel: string;
  readonly listLabel: string;
}

/** Identity search plus the chosen people with their eligibility. */
export function E2eePeoplePicker({
  selected,
  statusFor,
  reasonFor,
  onRetry,
  onAdd,
  onRemove,
  searchLabel,
  listLabel,
}: E2eePeoplePickerProps) {
  const locale = useBrowserLocale();
  const selectedWallets = selected
    .map((person) => person.wallet)
    .filter((wallet): wallet is string => wallet !== null);

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <GroupCreateIdentitiesSearch
        selectedWallets={selectedWallets}
        onIdentitySelect={onAdd}
        label={searchLabel}
        hideLabel
        placeholder={searchLabel}
        appearance="modal"
        resultsLayout="inline"
        sort="level"
      />
      {selected.length === 0 ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(locale, "e2ee.new.noneSelected")}
        </p>
      ) : (
        <ul
          aria-label={listLabel}
          className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0"
        >
          {selected.map((person) => {
            const name = person.handle ?? t(locale, "e2ee.unknownMember");
            return (
              <li
                key={person.profileId}
                className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
              >
                <E2eeAvatar pfp={person.pfp} name={name} size="sm" />
                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
                  <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                    {name}
                  </span>
                  <EligibilityStatus
                    status={statusFor(person.profileId)}
                    reason={reasonFor?.(person.profileId) ?? null}
                    onRetry={() => onRetry(person.profileId)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(person.profileId)}
                  aria-label={t(locale, "e2ee.new.remove", { name })}
                  className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  <XMarkIcon aria-hidden="true" className="tw-size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
