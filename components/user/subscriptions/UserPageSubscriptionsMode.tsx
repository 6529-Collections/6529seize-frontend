"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
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
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-4 sm:tw-gap-5">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
            Mode
          </h3>
          {props.details && props.details.last_update > 0 && (
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
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
        <p
          id={descriptionId}
          className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-5 tw-text-iron-400"
        >
          <span className="tw-font-medium tw-text-iron-200">
            {isAuto ? "Automatic" : "Manual"}
          </span>
          {!props.readonly && (
            <>
              <span aria-hidden="true"> · </span>
              {isAuto
                ? "Airdrops all eligible drops unless you opt out"
                : "Opt in to each specific drop"}
            </>
          )}
        </p>
      </div>
      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
        <UserPageSubscriptionsToggle
          disabled={isDisabled}
          id="subscription-mode"
          checked={isAuto}
          onChange={toggleMode}
          ariaLabel="Automatic subscription mode"
          describedBy={descriptionId}
        />
        {isUpdating && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
      </div>
    </div>
  );
}
