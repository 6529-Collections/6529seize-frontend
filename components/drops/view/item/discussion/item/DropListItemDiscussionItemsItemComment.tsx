import { DropActivityLogDiscussion } from "../../../../../../entities/IDrop";

export default function DropListItemDiscussionItemsItemComment({
  item,
}: {
  readonly item: DropActivityLogDiscussion;
}) {
  return (
    <p className="tw-text-sm tw-text-white tw-font-normal tw-mb-0">
      {item.contents.content}
    </p>
  );
}
