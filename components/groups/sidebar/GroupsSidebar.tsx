import GroupHeader from "../header/GroupHeader";
import GroupSelect from "../select/GroupSelect";
import type { GroupSelectVariant } from "../select/groupSelect.types";

export default function Groups({
  variant = "default",
}: {
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const isMobileSheet = variant === "mobile-sheet";

  return (
    <div className={isMobileSheet ? "tw-pb-6" : "tw-pb-4"}>
      <GroupHeader variant={variant} />
      <GroupSelect variant={variant} />
    </div>
  );
}
