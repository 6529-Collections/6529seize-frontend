import GroupHeaderSelect from "./GroupHeaderSelect";
import type { GroupSelectVariant } from "../select/groupSelect.types";

export default function GroupHeader({
  variant = "default",
}: {
  readonly variant?: GroupSelectVariant | undefined;
}) {
  return (
    <div className="tw-px-4 tw-pt-4">
      <GroupHeaderSelect variant={variant} />
    </div>
  );
}
