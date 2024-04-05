import { Time } from "../../../../../helpers/time";
import DropAuthor, { DropAuthorSize } from "../../../create/utils/DropAuthor";
import DropPfp, { DropPFPSize } from "../../../create/utils/DropPfp";

export default function DropListItemDiscussionItemsItem() {
  return (
    <div className="tw-flex tw-gap-x-3">
      <DropPfp pfpUrl={null} size={DropPFPSize.SMALL} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          handle="memu"
          timestamp={Time.hoursAgo(12).toMillis()}
          size={DropAuthorSize.SMALL}
        />
        <div className="tw-mt-1 tw-w-full"> awesome content</div>
      </div>
    </div>
  );
}
