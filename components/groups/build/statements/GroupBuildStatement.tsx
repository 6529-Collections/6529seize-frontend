import { GroupDescriptionStatement } from "../GroupBuild";
import { GroupDescriptionStatementItem } from "./GroupBuildStatementsList";

export default function GroupBuildStatement({
  statement,
  onRemoveFilters,
  onStatementType,
}: {
  readonly statement: GroupDescriptionStatementItem;
  readonly onRemoveFilters?: (keys: GroupDescriptionStatement[]) => void;
  readonly onStatementType?: (type: GroupDescriptionStatement) => void;
}) {
  const showRemoveButton = !!onRemoveFilters;
  const allowStatementType = !!onStatementType;

  const onStatementClick = () => {
    if (allowStatementType) {
      onStatementType(statement.key);
    }
  };

  return (
    <div
      onClick={onStatementClick}
      className={`${
        allowStatementType ? "tw-cursor-pointer" : "tw-cursor-default"
      } tw-inline-flex tw-items-center tw-justify-between tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 tw-bg-iron-400/10 tw-ring-1 tw-ring-inset tw-ring-iron-700`}
    >
      {statement.label}
      {showRemoveButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFilters([statement.key]);
          }}
          type="button"
          className="tw-bg-transparent tw-px-1 tw-items-center -tw-right-1 tw-relative  tw-border-none tw-group tw-text-iron-300 hover:tw-text-red hover:tw-scale-110 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-sr-only">Remove</span>
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 14 14"
            aria-hidden="true"
            className="tw-h-3.5 tw-w-3.5"
          >
            <path d="M4 4l6 6m0-6l-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
