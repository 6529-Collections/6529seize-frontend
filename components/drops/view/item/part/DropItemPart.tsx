import { Drop } from "../../../../../generated/models/Drop";
import { DropPart } from "../../../../../generated/models/DropPart";
import DropItemPartConnectorLine from "./DropItemPartConnectorLine";
import DropItemPartPfp from "./DropItemPartPfp";

export default function DropItemPart({
  drop,
  isLast,
}: {
  readonly drop: Drop;
  readonly isLast: boolean;
}) {
  return (
    <div className="tw-flex ">
      <div className="tw-col-span-1">
        <DropItemPartPfp pfpUrl={drop.author.pfp} />
        {!isLast && <DropItemPartConnectorLine />}
      </div>
      <div className="tw-col-span-1 ">sisu</div>
    </div>
  );
}
