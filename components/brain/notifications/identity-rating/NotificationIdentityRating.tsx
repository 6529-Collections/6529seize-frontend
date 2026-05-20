import { AuthContext } from "@/components/auth/Auth";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type {
  INotificationIdentityNic,
  INotificationIdentityRep,
} from "@/types/feed.types";
import Link from "next/link";
import { useContext, type ReactNode } from "react";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  formatSignedNotificationNumber,
  getNotificationRatingColor,
  isNotificationNumber,
} from "../utils/notificationRatingUtils";

interface NotificationIdentityRatingProps {
  readonly notification: INotificationIdentityRep | INotificationIdentityNic;
}

function getTotalLabel({
  isRep,
  category,
}: {
  readonly isRep: boolean;
  readonly category: string | undefined;
}): ReactNode {
  if (isRep && category) {
    return (
      <>
        Total for{" "}
        <span className="tw-font-medium tw-text-iron-300">{category}</span>
      </>
    );
  }

  if (isRep) {
    return (
      <>
        Total <span className="tw-font-medium tw-text-iron-300">REP</span>
      </>
    );
  }

  return (
    <>
      Total <span className="tw-font-medium tw-text-iron-300">NIC</span>
    </>
  );
}

function NotificationRatingInlinePart({
  label,
  value,
  separator = "bullet",
}: {
  readonly label: ReactNode;
  readonly value: number | null | undefined;
  readonly separator?: "bullet" | "arrow";
}) {
  if (!isNotificationNumber(value)) {
    return null;
  }

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-x-1 tw-whitespace-nowrap">
      <span
        className={
          separator === "arrow"
            ? "tw-text-base tw-font-bold tw-text-iron-400"
            : "tw-text-xs tw-font-bold tw-text-iron-400"
        }
      >
        {separator === "arrow" ? "\u2192" : "\u2022"}
      </span>
      <span className="tw-text-iron-400">{label}:</span>
      <span
        className={`tw-font-medium tw-tabular-nums ${getNotificationRatingColor(
          value
        )}`}
      >
        {formatSignedNotificationNumber(value)}
      </span>
    </span>
  );
}

export default function NotificationIdentityRating({
  notification,
}: NotificationIdentityRatingProps) {
  const { connectedProfile } = useContext(AuthContext);
  const isRep = notification.cause === ApiNotificationCause.IdentityRep;
  const { amount, rater_rating, total } = notification.additional_context;
  const category =
    "category" in notification.additional_context
      ? notification.additional_context.category
      : undefined;

  const ratingLabel = isRep ? "REP" : "NIC";
  const profileHref = connectedProfile?.handle
    ? `/${connectedProfile.handle}`
    : null;
  const ratingPhrase = (
    <>
      <span className="tw-font-medium tw-text-iron-300">{ratingLabel}</span>
      {isRep ? null : " rating"}
      {category ? (
        <>
          {" "}
          for{" "}
          <span className="tw-font-medium tw-text-iron-300">{category}</span>
        </>
      ) : null}
    </>
  );
  const totalLabel = getTotalLabel({ isRep, category });

  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        authorClassName="tw-text-base"
        actions={
          <NotificationsFollowBtn
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-base tw-font-normal tw-text-iron-400">
          updated your{" "}
          {profileHref ? (
            <Link
              href={profileHref}
              className="tw-text-base tw-no-underline hover:tw-underline"
            >
              {ratingPhrase}
            </Link>
          ) : (
            ratingPhrase
          )}
        </span>
        <NotificationRatingInlinePart label="Change" value={amount} />
        <NotificationRatingInlinePart
          label="New rating"
          value={rater_rating}
          separator="arrow"
        />
        <NotificationRatingInlinePart label={totalLabel} value={total} />
        <NotificationTimestamp
          createdAt={notification.created_at}
          className="tw-text-base"
        />
      </NotificationHeader>
    </div>
  );
}
