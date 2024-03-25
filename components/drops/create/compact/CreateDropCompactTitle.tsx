import PencilIcon, { PencilIconSize } from "../../../utils/icons/PencilIcon";

export default function CreateDropCompactTitle({
  title,
  onEditClick,
}: {
  readonly title: string | null;
  readonly onEditClick: () => void;
}) {
  return (
    <button
      className="tw-bg-transparent tw-border-none tw-inline-flex tw-space-x-2 tw-items-center"
      onClick={onEditClick}
    >
      <div>{title}</div>
      <PencilIcon size={PencilIconSize.SMALL} />
    </button>
  );
}
