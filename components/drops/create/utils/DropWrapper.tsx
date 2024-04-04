import { DropFull } from "../../../../entities/IDrop";
import DropListItemRepState from "../../view/item/reps/give/DropListItemRepState";
import DropAuthor from "./DropAuthor";
import DropPfp from "./DropPfp";

export default function DropWrapper({
  drop,
  children,
  isQuoted = false,
}: {
  readonly drop: DropFull;
  readonly children: React.ReactNode;
  readonly isQuoted?: boolean;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <DropPfp pfpUrl={drop.author.pfp} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <div className="tw-w-full tw-inline-flex tw-justify-between">
          <DropAuthor handle={drop.author.handle} timestamp={drop.created_at} />
          {!isQuoted && (
            <DropListItemRepState
              userRep={drop.rep_given_by_input_profile ?? 0}
              totalRep={drop.rep}
            />
          )}
        </div>
        <div className="tw-mt-1 tw-w-full">{children}</div>
      </div>
    </div>
  );
}
