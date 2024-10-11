import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";

export default function GroupItemWrapper({
  group,
  isActive,
  children,
  deactivateHover,
  onActiveGroupId,
}: {
  readonly group: ApiGroupFull;
  readonly isActive: boolean;
  readonly deactivateHover: boolean;
  readonly children: React.ReactNode;
  readonly onActiveGroupId?: (groupId: string | null) => void;
}) {
  const banner1 =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle);
  const banner2 =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle);

  const onFilterClick = () => {
    if (isActive || !onActiveGroupId) return;
    onActiveGroupId(group.id);
  };

  const getClasses = () => {
    if (!isActive)
      return "tw-border-iron-700 hover:tw-border-primary-300 tw-cursor-pointer";
    if (deactivateHover) return "hover:tw-border-yellow";
    else return "tw-border-primary-300 ";
  };

  const classes = getClasses();

  return (
    <div>
      <div
        onClick={onFilterClick}
        className={`tw-bg-iron-900 tw-w-full tw-text-left tw-relative tw-border tw-border-solid tw-rounded-xl tw-transition tw-duration-300 tw-ease-out ${classes}`}
      >
        <div
          className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}
        ></div>
        {children}
      </div>
    </div>
  );
}
