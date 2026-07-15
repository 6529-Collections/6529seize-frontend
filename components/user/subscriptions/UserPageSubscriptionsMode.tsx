"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useId, useState } from "react";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

export default function UserPageSubscriptionsMode(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const descriptionId = useId();
  const isDisabled = props.readonly || isUpdating;

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
    <div className="tw-min-w-0 tw-p-1">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3">
          <h3 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            Mode
          </h3>
          {props.details && props.details.last_update > 0 && (
            <span className="tw-ml-auto tw-whitespace-nowrap tw-text-right tw-text-xs tw-font-normal tw-text-iron-600">
              {new Date(props.details.last_update).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "UTC",
              })}{" "}
              UTC
            </span>
          )}
        </div>
        <div className="tw-mt-1 tw-flex tw-min-h-11 tw-items-center tw-gap-2.5">
          <label
            htmlFor="subscription-mode"
            className={`tw-whitespace-nowrap tw-text-xs tw-font-medium sm:tw-text-sm ${
              isDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
            } ${isAuto ? "tw-text-iron-500" : "tw-text-iron-100"}`}
          >
            Manual
          </label>
          <UserPageSubscriptionsToggle
            disabled={isDisabled}
            id="subscription-mode"
            checked={isAuto}
            onChange={toggleMode}
            ariaLabel="Automatic subscription mode"
            describedBy={props.readonly ? undefined : descriptionId}
          />
          <label
            htmlFor="subscription-mode"
            className={`tw-whitespace-nowrap tw-text-xs tw-font-medium sm:tw-text-sm ${
              isDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
            } ${isAuto ? "tw-text-iron-100" : "tw-text-iron-500"}`}
          >
            Automatic
          </label>
        </div>
      </div>
      {!props.readonly && (
        <p
          id={descriptionId}
          className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-light tw-leading-relaxed tw-text-iron-500"
        >
          {isAuto
            ? "Automatic airdrops of all eligible drops unless you opt-out"
            : "You have to opt-in to each specific drop"}
        </p>
      )}
    </div>
  );
}
