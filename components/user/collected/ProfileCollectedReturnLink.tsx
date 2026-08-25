"use client";

import { getProfileCollectedReturnContext } from "@/helpers/profile-collected-navigation";
import useCapacitor from "@/hooks/useCapacitor";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default function ProfileCollectedReturnLink({
  locale,
  returnTo,
}: {
  readonly locale: SupportedLocale;
  readonly returnTo?: string | null | undefined;
}) {
  const { isCapacitor } = useCapacitor();
  const returnContext = getProfileCollectedReturnContext(returnTo);

  if (!returnContext || isCapacitor) {
    return null;
  }

  return (
    <Link
      href={returnContext.href}
      replace
      data-testid="back-to-profile-collected"
      className="tw-text-primary-200 desktop-hover:hover:tw-text-primary-100 tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-text-sm tw-font-medium tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-hidden"
    >
      <FontAwesomeIcon
        icon={faArrowCircleLeft}
        className="tw-h-[18px] tw-w-[18px]"
        aria-hidden="true"
      />
      {t(locale, "user.collected.navigation.backToCollected", {
        profile: returnContext.profile,
      })}
    </Link>
  );
}
