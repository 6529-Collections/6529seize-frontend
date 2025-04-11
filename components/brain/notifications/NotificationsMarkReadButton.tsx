import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEnvelopeOpenText,
} from "@fortawesome/free-solid-svg-icons";
import { TypedNotification } from "../../../types/feed.types";
import { useRef, useState } from "react";
import { commonApiPostWithoutBodyAndResponse } from "../../../services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useQueryClient } from "@tanstack/react-query";
import { ApiNotificationsResponse } from "../../../generated/models/ApiNotificationsResponse";
import { useNotificationsContext } from "../../notifications/NotificationsContext";

export default function NotificationsMarkReadButton({
  notification,
}: {
  readonly notification: TypedNotification;
}) {
  const { removeNotificationById } = useNotificationsContext();

  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wasRead, setWasRead] = useState(!!notification.read_at);
  const queryClient = useQueryClient();

  const isRead = wasRead;
  const buttonIcon = isHovered
    ? isRead
      ? faEnvelope // read → hover → show closed
      : faEnvelopeOpenText // unread → hover → show open
    : isRead
    ? faEnvelopeOpenText // read → default
    : faEnvelope; // unread → default

  const tooltip = isLoading ? "" : isRead ? "Mark as unread" : "Mark as read";

  const toggleRead = async () => {
    setIsHovered(false);
    setIsLoading(true);

    const endpoint = isRead
      ? `notifications/${notification.id}/unread`
      : `notifications/${notification.id}/read`;

    await commonApiPostWithoutBodyAndResponse({
      endpoint,
    })
      .then(async () => {
        const queriesUnread = queryClient.getQueriesData({
          queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, { unread: true }],
        });

        const queriesRead = queryClient.getQueriesData({
          queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, { unread: false }],
        });

        queriesUnread.forEach(([key, data]) => {
          queryClient.setQueryData(
            key,
            (oldData: { pages: ApiNotificationsResponse[] } | undefined) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  notifications: page.notifications.filter(
                    (n) => n.id !== notification.id
                  ),
                })),
              };
            }
          );
        });
        queriesRead.forEach(([key, data]) => {
          queryClient.setQueryData(
            key,
            (oldData: { pages: ApiNotificationsResponse[] } | undefined) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  notifications: page.notifications.map((n) =>
                    n.id === notification.id ? { ...n, read_at: new Date() } : n
                  ),
                })),
              };
            }
          );
        });

        await removeNotificationById(notification.id.toString());

        setWasRead(!isRead);
      })
      .catch((error) => {
        console.error(
          "Error marking notification as read",
          notification.id,
          error
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="tw-flex tw-gap-x-2 tw-items-center tw-relative">
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`clear-tooltip-${notification.id}`}>{tooltip}</Tooltip>
        }>
        <button
          onClick={toggleRead}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="tw-px-2.5 tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-iron-800"
          aria-label={tooltip}
          disabled={isLoading}>
          {isLoading ? (
            <CircleLoader size={CircleLoaderSize.SMALL} />
          ) : (
            <>
              <FontAwesomeIcon
                icon={buttonIcon}
                className="tw-size-3.5 tw-flex-shrink-0"
              />
              {((!isRead && !isHovered) || (isRead && isHovered)) && (
                <span className="tw-absolute tw-top-1.5 tw-right-2 tw-size-1.5 tw-bg-red tw-rounded-full"></span>
              )}
            </>
          )}
        </button>
      </OverlayTrigger>
    </div>
  );
}
