import DirectMessageRecipients, {
  type DirectMessageRecipient,
  recipientKey,
  recipientName,
} from "@/components/waves/create-dm/DirectMessageRecipients";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { type E2eeSelectedPerson, EligibilityStatus } from "./E2eePeoplePicker";
import type { useE2eeEligibility } from "./useE2eeEligibility";

interface MessageRecipientsProps {
  readonly selected: readonly E2eeSelectedPerson[];
  readonly onAdd: (person: CommunityMemberMinimal) => void;
  readonly onRemove: (profileId: string) => void;
  readonly disabled: boolean;
  readonly eligibility: ReturnType<typeof useE2eeEligibility> | null;
}

type SelectedRecipient = DirectMessageRecipient & {
  readonly profile_id: string;
};

export function MessageRecipients({
  selected,
  onAdd,
  onRemove,
  disabled,
  eligibility,
}: MessageRecipientsProps) {
  const locale = useBrowserLocale();
  const people = selected.map(
    (person): SelectedRecipient => ({
      profile_id: person.profileId,
      primary_wallet: person.wallet,
      wallet: person.wallet,
      handle: person.handle,
      display: t(locale, "e2ee.unknownMember"),
      pfp: person.pfp,
    })
  );

  return (
    <DirectMessageRecipients
      selected={people}
      onToggle={(person) => {
        const existing = people.find(
          (item) =>
            item.profile_id === person.profile_id ||
            recipientKey(item) === recipientKey(person)
        );
        if (existing?.profile_id) onRemove(existing.profile_id);
        else onAdd(person);
      }}
      onRemove={(key) => {
        const profileId = people.find(
          (person) => recipientKey(person) === key
        )?.profile_id;
        if (profileId) onRemove(profileId);
      }}
      disabled={disabled}
      dismissibleResults
      selectionStatus={
        eligibility &&
        selected.length > 0 && (
          <ul
            aria-label={t(locale, "e2ee.new.selected")}
            aria-live="polite"
            className="tw-mb-0 tw-mt-2 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0"
          >
            {people.map((person) => {
              const profileId = person.profile_id;
              return (
                <li
                  key={profileId}
                  className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0.5"
                >
                  <span className="tw-min-w-0 tw-break-words tw-text-xs tw-font-medium tw-text-iron-300">
                    {recipientName(person)}
                  </span>
                  <EligibilityStatus
                    status={eligibility.statusFor(profileId)}
                    reason={eligibility.reasonFor(profileId)}
                    onRetry={() => eligibility.retry(profileId)}
                  />
                </li>
              );
            })}
          </ul>
        )
      }
    />
  );
}
