import GroupBuild from "../build/GroupBuild";
import GroupHeader from "../header/GroupHeader";
import GroupSelect from "../select/GroupSelect";
import { useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { setActiveGroupId } from "../../../store/groupSlice";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { GroupFull } from "../../../generated/models/GroupFull";

export enum GroupsView {
  SELECT = "SELECT",
  BUILD = "BUILD",
}

export default function Groups() {
  const dispatch = useDispatch();
  const { onGroupChanged } = useContext(ReactQueryWrapperContext);
  const [editFilter, setEditFilter] = useState<GroupFull | null>(null);

  const [view, setView] = useState<GroupsView>(GroupsView.SELECT);

  const onEditClick = (filter: GroupFull) => {
    setEditFilter(filter);
    setView(GroupsView.BUILD);
    dispatch(setActiveGroupId(filter.id));
  };

  const onView = (view: GroupsView) => {
    setEditFilter(null);
    setView(view);
  };

  const onSaved = (response: GroupFull) => {
    setEditFilter(null);
    setView(GroupsView.SELECT);
    dispatch(setActiveGroupId(response.id));
    onGroupChanged({ groupId: response.id });
  };

  return (
    <div className="tw-pb-4">
      <GroupHeader view={view} setView={onView} />
      {view === GroupsView.SELECT && <GroupSelect onEditClick={onEditClick} />}
      {view === GroupsView.BUILD && (
        <GroupBuild originalGroup={editFilter} onSaved={onSaved} />
      )}
    </div>
  );
}
