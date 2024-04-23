import { DropActivityLog } from "../../../../../../entities/IDrop";
import { ProfileActivityLogType } from "../../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";
import DropAuthor, {
  DropAuthorSize,
} from "../../../../create/utils/author/DropAuthor";
import DropPfp, { DropPFPSize } from "../../../../create/utils/DropPfp";
import DropListItemDiscussionItemsItemComment from "./DropListItemDiscussionItemsItemComment";
import DropListItemDiscussionItemsItemDropCreated from "./DropListItemDiscussionItemsItemDropCreated";
import DropListItemDiscussionItemsItemRate from "./DropListItemDiscussionItemsItemRate";

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
        return <DropListItemDiscussionItemsItemRate item={item} />;
      case ProfileActivityLogType.DROP_CREATED:
        return <DropListItemDiscussionItemsItemDropCreated />;
      default:
        assertUnreachable(itemType);
    }
  };

  if (!item.author) return null;

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <DropPfp pfpUrl={item.author?.pfp} size={DropPFPSize.SMALL} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor
          profile={item.author}
          timestamp={new Date(item.created_at).getTime()}
          size={DropAuthorSize.SMALL}
        />
        <div className="tw-mt-0.5 tw-w-full">{getComponent()}</div>
      </div>
    </div>
  );
}
