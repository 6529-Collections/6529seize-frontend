import { GroupsView } from "../Groups";
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

  return (
    <div className="tw-px-4 tw-space-y-4">
      <p className="tw-text-lg tw-pt-4 tw-text-iron-50 tw-font-semibold tw-mb-0 tw-whitespace-nowrap tw-inline-flex">
        Curate{" "}
        <span className="tw-pl-1.5 tw-text-xs tw-leading-7 tw-uppercase">
          (Alpha)
        </span>
      </p>
      {components[view]}
    </div>
  );
}
