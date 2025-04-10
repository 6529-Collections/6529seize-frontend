import { faInbox, faBell, faBroom } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

export default function NotificationsUnreadToggle({
  showUnreadNotifications,
  toggleNotifications,
  onReadAll,
  isLoadingReadAll = false,
  isDisabledReadAll = false,
}: {
  readonly showUnreadNotifications: boolean;
  readonly toggleNotifications: () => void;
  readonly onReadAll: () => void;
  readonly isLoadingReadAll: boolean;
  readonly isDisabledReadAll: boolean;
}) {
  const getAllTooltip = () => {
    return showUnreadNotifications ? "All Notifications" : "";
  };

  const getUnreadTooltip = () => {
    return !showUnreadNotifications ? "Unread Notifications" : "";
  };

  const getActiveButtonStyle = () => {
    return "tw-bg-iron-800 tw-text-primary-400 tw-font-medium";
  };

  const getInactiveButtonStyle = () => {
    return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent";
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-1.5">
      <div className="tw-relative tw-flex tw-nowrap tw-items-center tw-gap-1 tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-px-1">
        {showUnreadNotifications ? (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="show-all-notifications-tooltip">
                {getAllTooltip()}
              </Tooltip>
            }>
            <button
              disabled={!showUnreadNotifications}
              onClick={() => toggleNotifications()}
              className={`tw-px-3 tw-py-2 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getInactiveButtonStyle()}`}
              aria-label="Show all notifications">
              <FontAwesomeIcon
                icon={faInbox}
                className="tw-size-3.5 tw-flex-shrink-0"
              />
            </button>
          </OverlayTrigger>
        ) : (
          <button
            disabled={!showUnreadNotifications}
            onClick={() => toggleNotifications()}
            className={`tw-px-3 tw-py-2 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getActiveButtonStyle()}`}
            aria-label="Show all notifications">
            <FontAwesomeIcon
              icon={faInbox}
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          </button>
        )}

        {showUnreadNotifications ? (
          <button
            disabled={showUnreadNotifications}
            onClick={() => toggleNotifications()}
            className={`tw-px-2.5 tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getActiveButtonStyle()}`}
            aria-label="Show unread notifications">
            <FontAwesomeIcon
              icon={faBell}
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          </button>
        ) : (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="show-unread-notifications-tooltip">
                {getUnreadTooltip()}
              </Tooltip>
            }>
            <button
              disabled={showUnreadNotifications}
              onClick={() => toggleNotifications()}
              className={`tw-px-2.5 tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getInactiveButtonStyle()}`}
              aria-label="Show unread notifications">
              <FontAwesomeIcon
                icon={faBell}
                className="tw-size-3.5 tw-flex-shrink-0"
              />
            </button>
          </OverlayTrigger>
        )}
      </div>
      <div className="tw-relative tw-flex tw-nowrap tw-items-center tw-gap-1 tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-px-1">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="clear-tooltip">Mark all as read</Tooltip>}>
          <button
            disabled={isLoadingReadAll || isDisabledReadAll}
            onClick={onReadAll}
            className={`tw-px-2.5 tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getInactiveButtonStyle()}`}
            aria-label="Mark all as read">
            {isLoadingReadAll ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              <FontAwesomeIcon
                icon={faBroom}
                className="tw-size-4 tw-flex-shrink-0"
              />
            )}
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
