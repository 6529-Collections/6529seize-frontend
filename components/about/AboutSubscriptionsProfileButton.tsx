"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { getProfileSubscriptionsHref } from "@/components/user/subscriptions/subscriptionNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useContext } from "react";

export default function AboutSubscriptionsProfileButton() {
  const { connectedProfile } = useContext(AuthContext);
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const locale = useBrowserLocale();
  const hideSubscriptions =
    cookieConsent === undefined
      ? false
      : shouldHideSubscriptions({
          capacitorIsIos: capacitor.isIos,
          country: cookieConsent.country,
        });
  const profileSubscriptionsHref =
    getProfileSubscriptionsHref(connectedProfile);

  if (hideSubscriptions || !profileSubscriptionsHref) {
    return null;
  }

  return (
    <Link
      href={profileSubscriptionsHref}
      className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-ring-1 tw-ring-inset tw-ring-primary-400/50 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-text-white"
    >
      {t(locale, "home.mintSubscriptions.profileSubscriptionsLink")}
      <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
    </Link>
  );
}
