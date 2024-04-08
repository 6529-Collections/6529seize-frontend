import { ProfileActivityLogType } from "../../../../../../entities/IProfile";
import { DropItemDiscussionFilterType } from "../DropListItemDiscussion";
import DropListItemDiscussionFilterItem from "./DropListItemDiscussionFilterItem";

export default function DropListItemDiscussionFilter({
  activeFilter,
  setFilter,
}: {
  readonly activeFilter: DropItemDiscussionFilterType;
  readonly setFilter: (filter: DropItemDiscussionFilterType) => void;
}) {
  return (
    <nav className="tw-flex">
      <DropListItemDiscussionFilterItem
        filter={null}
        setFilter={setFilter}
        activeFilter={activeFilter}
      >
        All
      </DropListItemDiscussionFilterItem>
      <DropListItemDiscussionFilterItem
        filter={ProfileActivityLogType.DROP_COMMENT}
        setFilter={setFilter}
        activeFilter={activeFilter}
      >
        Discuss
      </DropListItemDiscussionFilterItem>
      <DropListItemDiscussionFilterItem
        filter={ProfileActivityLogType.DROP_REP_EDIT}
        setFilter={setFilter}
        activeFilter={activeFilter}
      >
        Rep
      </DropListItemDiscussionFilterItem>
    </nav>
  );
}
