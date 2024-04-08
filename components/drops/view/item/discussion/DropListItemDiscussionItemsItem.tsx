import { Time } from "../../../../../helpers/time";
import DropAuthor, { DropAuthorSize } from "../../../create/utils/DropAuthor";
import DropPfp, { DropPFPSize } from "../../../create/utils/DropPfp";

export default function DropListItemDiscussionItemsItem() {
  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <DropPfp pfpUrl={null} size={DropPFPSize.SMALL} />
      <div className="-tw-mt-1.5 tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          handle="memu"
          timestamp={Time.hoursAgo(12).toMillis()}
          size={DropAuthorSize.SMALL}
        />
        <div className="tw-mt-0.5 tw-w-full">
          <p className="tw-text-sm tw-text-white tw-font-normal tw-mb-0">
            awesome content
          </p>
        </div>
      </div>
    </div>
  );
}
