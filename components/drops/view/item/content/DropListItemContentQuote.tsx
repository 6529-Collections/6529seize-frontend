import { Drop } from "../../../../../generated/models/Drop";
import DropWrapper from "../../../create/utils/DropWrapper";
import DropListItemContentMarkdown from "./DropListItemContentMarkdown";

export default function DropListItemContentQuote({
  drop,
  showFull = false,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
}) {
  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (["A", "BUTTON"].includes(target.tagName)) {
      return;
    }
    window.open(`/brain/${drop.id}`, "_blank");
  };

  return (
    <div
      onClick={onClick}
      className="tw-cursor-pointer tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-bg-iron-900 tw-rounded-xl tw-p-2 tw-mt-4"
    >
      <DropWrapper drop={drop}>
        <DropListItemContentMarkdown drop={drop} showFull={showFull} />
      </DropWrapper>
    </div>
  );
}
