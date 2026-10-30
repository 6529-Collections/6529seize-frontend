"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

export default function UserPageSubscriptionsMode(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const isDisabled = props.readonly || isUpdating || !props.details;

  useEffect(() => {
    setIsAuto(props.details?.automatic ?? false);
  }, [props.details]);

  const toggleMode = async (): Promise<void> => {
    if (isUpdating) {
      return;
    }
    setIsUpdating(true);
    const { success } = await requestAuth();
    if (!success) {
      setIsUpdating(false);
      return;
    }
    const auto = !isAuto;
    interface SubscribeModeBody {
      automatic: boolean;
    }
    try {
      const response = await commonApiPost<
        SubscribeModeBody,
        SubscribeModeBody
      >({
        endpoint: `subscriptions/${props.profileKey}/subscription-mode`,
        body: {
          automatic: auto,
        },
      });
      const responseAuto = response.automatic;
      setIsAuto(responseAuto);
      setToast({
        title: "Subscription mode updated.",
        description: responseAuto
          ? "Automatic mode is on for upcoming drops."
          : "Manual mode is on for upcoming drops.",
        type: "success",
      });
      props.refresh();
    } catch (e) {
      setIsUpdating(false);
      setToast({
        type: "error",
        title: "Couldn't update subscription mode.",
        description: "Please try again.",
        details: getToastErrorDetails(e, "Could not set subscription mode."),
      });
      return;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="tw-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-gap-2.5">
      <label
        htmlFor="subscription-mode"
        className="tw-text-sm tw-text-iron-300"
      >
        {t(locale, "subscriptions.coverage.mode.automatic")}
      </label>
      <UserPageSubscriptionsToggle
        disabled={isDisabled}
        id="subscription-mode"
        checked={isAuto}
        onChange={toggleMode}
        ariaLabel={t(locale, "subscriptions.mode.label")}
      />
    </div>
  );
}
