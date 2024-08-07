import { TypedNotification } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import NotificationItems from "./NotificationItems";

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function NotificationsWrapper({
  items,
  loading,
  onBottomIntersection,
}: NotificationsWrapperProps) {
  return (
    <div className="tw-relative">
      <NotificationItems items={items} />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
