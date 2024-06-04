import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../../store/groupSlice";

type Props = {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
};

const GroupsSidebarToggleButton = forwardRef<HTMLButtonElement, Props>(
  ({ open, setOpen }, ref) => {
    const activeGroupId = useSelector(selectActiveGroupId);
    const color =
      activeGroupId && !open
        ? "tw-text-primary-400 hover:tw-text-primary-300"
        : "tw-text-iron-400 hover:tw-text-iron-50";
    return (
      <button
        ref={ref}
        className={`${color} tw-fixed tw-mt-2 tw-z-50 tw-bg-iron-950 tw-border tw-border-l-0 tw-border-solid tw-border-neutral-600 tw-p-2 tw-rounded-r-lg  focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <svg
            className="tw-h-6 tw-w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="tw-h-6 tw-w-6"
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
          </svg>
        )}
      </button>
    );
  }
);

GroupsSidebarToggleButton.displayName = "GroupsSidebarToggleButton";

export default GroupsSidebarToggleButton;
