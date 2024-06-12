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
    <div>
      <div className="tw-relative">
        <div className="tw-relative tw-w-full tw-h-8 tw-rounded-t-xl tw-bg-gradient-to-tr tw-from-blue-500"></div>
        <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-ring-[1.5px] tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
        <div className="-tw-mt-1 tw-bg-iron-900 tw-flex tw-flex-col tw-rounded-b-xl tw-relative tw-border-[1.5px] tw-border-solid tw-border-t-0 tw-border-iron-700">
          <div className="tw-flex tw-flex-col tw-h-full">
            <div className="tw-px-4 tw-flex tw-gap-x-3">
              <img
                className="-tw-mt-2 tw-flex-shrink-0 tw-object-contain tw-h-8 tw-w-8 tw-rounded-lg tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
                src=""
                alt="Profile Picture"
              />
              <div className="tw-mt-1 tw-text-sm tw-flex tw-items-center tw-w-full tw-justify-between">
                <span className="tw-text-iron-50 tw-font-semibold">simo</span>
                <span className="tw-text-iron-400 tw-font-normal tw-text-xs">
                  16 hours ago
                </span>
              </div>
            </div>
            <div className="tw-pt-3 tw-pb-3 tw-flex tw-flex-col tw-h-full tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
              <div className="tw-flex-1 tw-px-4">
                <p className="tw-mb-0 tw-text-sm tw-text-iron-50 tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-overflow-ellipsis tw-truncate">
                  my awesome stuff
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={onFilterClick}
        className={` tw-bg-iron-900 tw-rounded-lg tw-w-full tw-text-left tw-border tw-border-solid  tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700 tw-transition tw-duration-300 tw-ease-out  ${classes}`}
      >
        {children}
      </div>
    </div>
  );
}
