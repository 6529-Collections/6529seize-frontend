"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getNewEncryptedChatRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  setE2eeComposePrefill,
  type E2eePrefillPerson,
} from "../e2eeComposePrefill";
import { useE2eeNow } from "../useE2eeNow";
import {
  formatLegacyDmDeletionDate,
  isLegacyDmClosed,
} from "./legacyDmRetention";

function toPrefillPeople(
  members: readonly CommunityMemberMinimal[]
): E2eePrefillPerson[] {
  return members.flatMap((member) =>
    member.profile_id
      ? [
          {
            profileId: member.profile_id,
            handle: member.handle,
            pfp: member.pfp,
            wallet: (member.primary_wallet ?? member.wallet).toLowerCase(),
          },
        ]
      : []
  );
}

/**
 * The new-DM form's own submit button: the main action without encrypted
 * chats, a smaller second choice when the encrypted chat leads.
 */
export function unencryptedDmButtonStyle(encryptedFirst: boolean): {
  readonly variant: "secondary" | "action";
  readonly size: "md" | "lg";
  readonly className?: string;
} {
  return encryptedFirst
    ? { variant: "secondary", size: "md" }
    : { variant: "action", size: "lg", className: "tw-min-h-[50px]" };
}

/**
 * Footer of the new-DM form while encrypted chats exist (D146): the
 * encrypted chat is the default action, and an unencrypted DM is an explicit
 * second choice that says it is deleted on the deletion date. Nothing is
 * downgraded silently. From the deletion date only the encrypted choice
 * remains. Without encrypted chats in this build, the form is unchanged.
 */
export function EncryptedFirstDmActions({
  selected,
  unencryptedButton,
  onEncrypted,
}: {
  readonly selected: readonly CommunityMemberMinimal[];
  /** The form's existing submit button, used as the unencrypted choice. */
  readonly unencryptedButton: ReactNode;
  readonly onEncrypted?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const { activeProfileProxy } = useAuth();
  const now = useE2eeNow();
  if (!isE2eeEnabled()) {
    return <>{unencryptedButton}</>;
  }
  const closed = now > 0 && isLegacyDmClosed(now);
  const people = toPrefillPeople(selected);
  const canEncrypt = activeProfileProxy === null && people.length > 0;

  const startEncrypted = () => {
    setE2eeComposePrefill({ people, source: "dm" });
    onEncrypted?.();
    router.push(getNewEncryptedChatRoute());
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      {activeProfileProxy === null ? (
        <Button
          type="button"
          variant="action"
          size="lg"
          fullWidth
          disabled={!canEncrypt}
          onClick={startEncrypted}
          className="tw-min-h-[50px]"
        >
          {t(locale, "e2ee.new.create")}
        </Button>
      ) : null}
      {closed ? null : (
        <>
          <p className="tw-m-0 tw-flex tw-items-start tw-gap-1.5 tw-text-xs tw-leading-5 tw-text-amber-200">
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0"
            />
            {t(locale, "e2ee.legacy.create.warning", {
              date: formatLegacyDmDeletionDate(locale),
            })}
          </p>
          {unencryptedButton}
        </>
      )}
    </div>
  );
}
