import { Drop } from "../../../../generated/models/Drop";
import DropItem from "./DropItem";

export default function DropItemWrapper({
  drop,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly availableCredit: number | null;
}) {
  return (
    <div className="tw-border-solid tw-border-red">
      <DropItem
        drop={drop}
        availableCredit={availableCredit}
      />
    </div>
  );
}
