import { Drop } from "../../../../../../../generated/models/Drop";
import DropAuthor from "../../../../../create/utils/author/DropAuthor";
import DropPfp from "../../../../../create/utils/DropPfp";
import { DropPartSize } from "../../../DropPart";

export default function DropPartDiscussionItem({
  item,
}: {
  readonly item: Drop;
}) {
  return (
    <div className="sm:tw-ml-[3.25rem] tw-flex tw-items-start tw-gap-x-3 tw-py-1 tw-mt-3">
      <DropPfp pfpUrl={item.author?.pfp} size={DropPartSize.SMALL} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          profile={item.author}
          timestamp={new Date(item.created_at).getTime()}
          size={DropPartSize.SMALL}
        />
        <div className="tw-mt-1 tw-w-full">
          <p className="tw-text-sm tw-text-white tw-font-normal tw-mb-0">
            {item.parts[0].content}
          </p>
        </div>
      </div>
    </div>
  );
}
