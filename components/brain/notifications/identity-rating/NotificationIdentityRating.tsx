import { AuthContext } from "@/components/auth/Auth";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type {
  INotificationIdentityNic,
  INotificationIdentityRep,
} from "@/types/feed.types";
import Link from "next/link";
import { useContext } from "react";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";

interface NotificationIdentityRatingProps {
  readonly notification: INotificationIdentityRep | INotificationIdentityNic;
}

function getRatingColor(rating: number): string {
  if (rating > 0) return "tw-text-green";
  if (rating < 0) return "tw-text-red";
  return "tw-text-iron-400";
}

function formatRating(rating: number): string {
  const prefix = rating > 0 ? "+" : "";
  return `${prefix}${formatNumberWithCommas(rating)}`;
}

export default function NotificationIdentityRating({
  notification,
}: NotificationIdentityRatingProps) {
  const { connectedProfile } = useContext(AuthContext);
  const isRep = notification.cause === ApiNotificationCause.IdentityRep;
  const { amount, total } = notification.additional_context;
  const category =
    "category" in notification.additional_context
      ? notification.additional_context.category
      : null;

  const myHandle = connectedProfile?.handle;
  const getProfileLink = (): string | null => {
    if (!myHandle) return null;
    return `/${myHandle}/identity`;
  };
  const linkHref = getProfileLink();

  const ratingLabel = isRep ? "REP" : "NIC";

  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <NotificationsFollowBtn
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          updated your{" "}
        </span>
        {linkHref ? (
          <Link
            href={linkHref}
            className="tw-text-sm tw-no-underline hover:tw-underline"
          >
            <span className="tw-font-medium tw-text-iron-300">
              {ratingLabel}
            </span>
            {category && (
              <span className="tw-font-normal tw-text-iron-400">
                {" "}
                for category &apos;{category}&apos;
              </span>
            )}
            <span className="tw-font-normal tw-text-iron-400"> by </span>
            <span className={`tw-font-medium ${getRatingColor(amount)}`}>
              {formatRating(amount)}
            </span>
          </Link>
        ) : (
          <span className="tw-text-sm">
            <span className="tw-font-medium tw-text-iron-300">
              {ratingLabel}
            </span>
            {category && (
              <span className="tw-font-normal tw-text-iron-400">
                {" "}
                for category &apos;{category}&apos;
              </span>
            )}
            <span className="tw-font-normal tw-text-iron-400"> by </span>
            <span className={`tw-font-medium ${getRatingColor(amount)}`}>
              {formatRating(amount)}
            </span>
          </span>
        )}
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-400">
          <span className="tw-mr-1 tw-text-xs tw-font-bold tw-text-iron-400">
            &#8226;
          </span>
          New Total:{" "}
          <span className={`tw-font-medium ${getRatingColor(total)}`}>
            {formatNumberWithCommas(total)}
          </span>
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </NotificationHeader>
    </div>
  );
}
