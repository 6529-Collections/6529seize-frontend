export default function DropListItemActionsItemWrapper<T>({
  state,
  children,
  setState,
}: {
  readonly state: T;
  readonly children: JSX.Element;
  readonly setState: (state: T) => void;
}) {
  const onState = () => setState(state);

  return (
    <button
      onClick={onState}
      type="button"
      className="tw-text-iron-400 icon tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-medium tw-transition tw-ease-out tw-duration-300"
    >
      {children}
    </button>
  );
}
