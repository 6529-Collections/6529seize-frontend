import { FC } from "react";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../../store/groupSlice";
import { FunnelIcon } from "@heroicons/react/24/outline";
interface Props {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

const GroupsSidebarAppToggle: FC<Props> = ({ open, setOpen }) => {
  const activeGroupId = useSelector(selectActiveGroupId);
  const color =
    activeGroupId && !open
      ? "tw-text-primary-400"
      : "tw-bg-iron-950 tw-text-iron-300";

  return (
    <button
      className={`tw-fixed tw-mt-2 tw-z-40 tw-bg-iron-950 active:tw-bg-iron-800 tw-border tw-border-l-0 tw-border-solid 
      tw-border-neutral-600 tw-p-2 tw-rounded-r-lg  focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out ${color}`}
      onClick={() => setOpen(!open)}
      aria-label="Toggle groups sidebar"
    >
      <FunnelIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
    </button>
  );
};

export default GroupsSidebarAppToggle;
