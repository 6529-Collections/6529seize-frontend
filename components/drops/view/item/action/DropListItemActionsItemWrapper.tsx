import { RepActionExpandable } from "../DropsListItem";

export default function DropListItemActionsItemWrapper({
  state,
  activeState,
  children,
  setState,
}: {
  readonly state: RepActionExpandable;
  readonly activeState: RepActionExpandable;
  readonly children: JSX.Element;
  readonly setState: (state: RepActionExpandable) => void;
}) {
  const onState = () => setState(state);

  return (
    <button
      onClick={onState}
      type="button"
      className={`${
        state === activeState
          ? "tw-text-primary-400"
          : "tw-text-iron-400 icon"
      } tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-medium tw-transition tw-ease-out tw-duration-300`}
    >
      {children}
    </button>
  );
}
