import { DropFull } from "../../../../entities/IDrop";
import DropAuthor from "./DropAuthor";
import DropPfp from "./DropPfp";

export default function DropWrapper({
  drop,
  children,
}: {
  readonly drop: DropFull;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <DropPfp pfpUrl={drop.author.pfp} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <div className="tw-w-full tw-inline-flex tw-justify-between">
          <DropAuthor handle={drop.author.handle} timestamp={drop.created_at} />
        </div>
        <div className="tw-mt-1 tw-w-full">{children}</div>
      </div>
    </div>
  );
}
