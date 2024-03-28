import { Time } from "../../../../../helpers/time";
import DropWrapper from "../../../create/utils/DropWrapper";

export default function DropListItemDiscussionItemsItem() {
  return (
    <DropWrapper handle="memu" timestamp={Time.hoursAgo(12).toMillis()}>
      awesome content
    </DropWrapper>
  );
}
