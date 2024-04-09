import { DropActivityLog } from "../../../../../../entities/IDrop";
import { ProfileActivityLogType } from "../../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";
import DropAuthor, {
  DropAuthorSize,
} from "../../../../create/utils/DropAuthor";
import DropPfp, { DropPFPSize } from "../../../../create/utils/DropPfp";
import DropListItemDiscussionItemsItemComment from "./DropListItemDiscussionItemsItemComment";
import DropListItemDiscussionItemsItemRep from "./DropListItemDiscussionItemsItemRep";

export default function DropListItemDiscussionItemsItem({
  item,
}: {
  readonly item: DropActivityLog;
}) {
  const getComponent = () => {
    const itemType = item.type;
    switch (itemType) {
      case ProfileActivityLogType.DROP_COMMENT:
        return <DropListItemDiscussionItemsItemComment item={item} />;
      case ProfileActivityLogType.DROP_REP_EDIT:
        return <DropListItemDiscussionItemsItemRep item={item} />;
      case ProfileActivityLogType.DROP_CREATED:
        // TODO: Implement this
        return <div>Drop created</div>;
      default:
        assertUnreachable(itemType);
    }
  };

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <DropPfp pfpUrl={item.author?.pfp} size={DropPFPSize.SMALL} />
      <div className="sm:-tw-mt-1 tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          handle={item.author?.handle ?? "Unknown"}
          timestamp={new Date(item.created_at).getTime()}
          size={DropAuthorSize.SMALL}
        />
        <div className="tw-mt-0.5 tw-w-full">{getComponent()}</div>
      </div>
    </div>
  );
}
