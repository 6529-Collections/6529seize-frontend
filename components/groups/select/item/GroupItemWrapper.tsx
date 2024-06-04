import { useDispatch } from "react-redux";
import { setActiveGroupId } from "../../../../store/groupSlice";
import { GroupFull } from "../../../../generated/models/GroupFull";

export default function GroupItemWrapper({
  filter,
  isActive,
  children,
  deactivateHover,
}: {
  readonly filter: GroupFull;
  readonly isActive: boolean;
  readonly deactivateHover: boolean;
  readonly children: React.ReactNode;
}) {
  const dispatch = useDispatch();

  const onFilterClick = () => {
    if (isActive) return;
    dispatch(setActiveGroupId(filter.id));
  };

  const getClasses = () => {
    if (!isActive)
      return "tw-border-iron-700 hover:tw-border-primary-300 tw-cursor-pointer";
    if (deactivateHover) return "hover:tw-border-yellow";
    else return "tw-border-primary-300 ";
  };

  const classes = getClasses();

  return (
    <div
      onClick={onFilterClick}
      className={` tw-bg-iron-950 tw-rounded-lg tw-w-full tw-text-left tw-border tw-border-solid  tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700  tw-transition tw-duration-300 tw-ease-out  ${classes}`}
    >
      {children}
    </div>
  );
}
