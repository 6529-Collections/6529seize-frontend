"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { getProfileSubscriptionsHref } from "@/components/user/subscriptions/subscriptionNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import { useState } from "react";

export default function AboutSubscriptionsProfileButton() {
  const { connectedProfile, setToast } = useAuth();
  const { seizeConnectFresh } = useSeizeConnectContext();
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const locale = useBrowserLocale();
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] =
    useState(false);
  const hideSubscriptions =
    cookieConsent === undefined
      ? false
      : shouldHideSubscriptions({
          capacitorIsIos: capacitor.isIos,
          country: cookieConsent.country,
        });
  const profileSubscriptionsHref =
    getProfileSubscriptionsHref(connectedProfile);

  const onConnect = async (): Promise<void> => {
    setShouldNavigateAfterConnect(true);

    try {
      await seizeConnectFresh();
    } catch (error) {
      setShouldNavigateAfterConnect(false);
      console.error("Failed to open wallet connection", error);
      setToast({
        message: "Failed to open wallet connection. Please try again.",
        type: "error",
      });
    }
  };

  if (hideSubscriptions) {
    return null;
  }

  if (shouldNavigateAfterConnect && profileSubscriptionsHref) {
    redirect(profileSubscriptionsHref, RedirectType.push);
  }

  if (!profileSubscriptionsHref) {
    return (
      <button
        type="button"
        onClick={() => {
          void onConnect();
        }}
        className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-ring-1 tw-ring-inset tw-ring-primary-400/50 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-primary-600"
      >
        {t(locale, "home.mintSubscriptions.connectToSubscribe")}
      </button>
    );
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
