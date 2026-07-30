"use client";

import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useProfileSubscriptionsNavigation } from "@/components/user/subscriptions/useProfileSubscriptionsNavigation";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

type SubscriptionActionVariant = "blue" | "white";

export default function AboutSubscriptionsProfileButton({
  variant = "blue",
}: {
  readonly variant?: SubscriptionActionVariant;
}) {
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const locale = useBrowserLocale();
  const {
    canNavigateToProfileSubscriptionsDirectly,
    isConnecting,
    openProfileSubscriptions,
    profileSubscriptionsHref,
  } = useProfileSubscriptionsNavigation();
  const hideSubscriptions =
    cookieConsent === undefined
      ? false
      : shouldHideSubscriptions({
          capacitorIsIos: capacitor.isIos,
          country: cookieConsent.country,
        });

  if (hideSubscriptions) {
    return null;
  }

  const handleOpenProfileSubscriptions = () => {
    openProfileSubscriptions().catch((error: unknown) => {
      console.error("Failed to open profile subscriptions", error);
    });
  };
  const connectToSubscribeLabel = t(
    locale,
    "home.mintSubscriptions.connectToSubscribe"
  );
  const manageSubscriptionsLabel = t(
    locale,
    "home.mintSubscriptions.manageSubscriptionsLink"
  );
  const subscriptionActionLabel = canNavigateToProfileSubscriptionsDirectly
    ? manageSubscriptionsLabel
    : connectToSubscribeLabel;
  const directProfileSubscriptionsHref =
    canNavigateToProfileSubscriptionsDirectly
      ? profileSubscriptionsHref
      : undefined;
  const buttonVariant = variant === "white" ? "primary" : "action";
  const buttonContent = (
    <>
      {subscriptionActionLabel}
      {profileSubscriptionsHref && (
        <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
      )}
    </>
  );

  if (directProfileSubscriptionsHref) {
    return (
      <ButtonLink
        href={directProfileSubscriptionsHref}
        variant={buttonVariant}
        size="md"
        className="tw-max-w-full"
      >
        {buttonContent}
      </ButtonLink>
    );
  }

  return (
    <Button
      type="button"
      loading={isConnecting}
      onClick={handleOpenProfileSubscriptions}
      variant={buttonVariant}
      size="md"
      className="tw-max-w-full"
    >
      {buttonContent}
    </Button>
  );
}
