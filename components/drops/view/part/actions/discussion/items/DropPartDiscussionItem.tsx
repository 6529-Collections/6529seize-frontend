import { DropComment } from "../../../../../../../generated/models/DropComment";
import DropAuthor, {
  DropAuthorSize,
} from "../../../../../create/utils/author/DropAuthor";
import DropPfp, { DropPFPSize } from "../../../../../create/utils/DropPfp";

export default function DropPartDiscussionItem({
  item,
}: {
  readonly item: DropComment;
}) {
  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <DropPfp pfpUrl={item.author?.pfp} size={DropPFPSize.SMALL} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          profile={item.author}
          timestamp={new Date(item.created_at).getTime()}
          size={DropAuthorSize.SMALL}
        />
        <div className="tw-mt-0.5 tw-w-full">
          <p className="tw-text-sm tw-text-white tw-font-normal tw-mb-0">
            {item.comment}
          </p>
        </div>
      </div>
    </div>
  );
}
