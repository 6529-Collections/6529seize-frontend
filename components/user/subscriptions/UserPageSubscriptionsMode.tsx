"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import Toggle from "react-toggle";

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
    <div>
      <div className="tw-pb-2">
        <div>
          <h5 className="tw-mb-0">
            Mode{" "}
            {props.details && props.details.last_update > 0 && (
              <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
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
          </h5>
        </div>
      </div>
      <div className="tw-pt-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <label htmlFor={"subscription-mode"} className="tw-text-white">
            <b>Manual</b>
          </label>
          <Toggle
            disabled={props.readonly || isUpdating}
            id={"subscription-mode"}
            checked={isAuto}
            icons={false}
            onChange={toggleMode}
          />
          <label htmlFor={"subscription-mode"} className="tw-text-white">
            <b>Automatic</b>
          </label>
          {isUpdating && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      </div>
      {!props.readonly && (
        <div className="tw-pt-1">
          <div className="tw-whitespace-nowrap">
            {isAuto
              ? "Automatic airdrops of all eligible drops unless you opt-out"
              : "You have to opt-in to each specific drop"}
          </div>
        </div>
      )}
    </div>
  );
}
