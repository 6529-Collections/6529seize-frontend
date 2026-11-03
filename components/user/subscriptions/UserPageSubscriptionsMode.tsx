"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import SubscriptionSettingToggle from "./SubscriptionSettingToggle";
import { formatSubscriptionCoverageDeadline } from "./coverage/subscriptionCoverage.helpers";

export default function UserPageSubscriptionsMode(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
    layout?: "row" | "inline";
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

  const setMode = async (auto: boolean): Promise<void> => {
    if (isDisabled || auto === isAuto) {
      return;
    }
    setIsUpdating(true);
    interface SubscribeModeBody {
      automatic: boolean;
    }
    try {
      const { success } = await requestAuth();
      if (!success) return;
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

  let modeDetail: string | undefined;
  if (!props.details) {
    modeDetail = t(locale, "subscriptions.settings.loading");
  } else if (props.details.last_update > 0) {
    modeDetail = formatSubscriptionCoverageDeadline(
      locale,
      new Date(props.details.last_update)
    );
  }

  return (
    <SubscriptionSettingToggle
      layout={props.layout ?? "row"}
      label={t(locale, "subscriptions.details.mode")}
      detail={modeDetail}
      describedBy={
        !props.readonly && props.details
          ? "profile-subscriptions-upcoming-description"
          : undefined
      }
      checked={isAuto}
      loading={!props.details}
      disabled={isDisabled}
      busy={isUpdating}
      onChange={() => {
        void setMode(!isAuto);
      }}
      offLabel={t(locale, "subscriptions.coverage.mode.manual")}
      onLabel={t(locale, "subscriptions.coverage.mode.automatic")}
      ariaLabel={t(locale, "subscriptions.mode.label")}
    />
  );
}
