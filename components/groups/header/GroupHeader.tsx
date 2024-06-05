import { GroupsView } from "../sidebar/GroupsSidebar";
import GroupHeaderBuild from "./GroupHeaderBuild";
import GroupHeaderSelect from "./GroupHeaderSelect";

export default function GroupHeader({
  view,
  setView,
}: {
  readonly view: GroupsView;
  readonly setView: (view: GroupsView) => void;
}) {
  const onView = () => {
    if (view === GroupsView.SELECT) {
      setView(GroupsView.BUILD);
    } else {
      setView(GroupsView.SELECT);
    }
  };

  const components: Record<GroupsView, JSX.Element> = {
    [GroupsView.BUILD]: <GroupHeaderBuild onView={onView} />,
    [GroupsView.SELECT]: <GroupHeaderSelect onView={onView} />,
  };

  return <div className="tw-px-4 tw-pt-4">{components[view]}</div>;
}
