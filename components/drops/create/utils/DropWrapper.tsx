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
      <div className="tw-hidden lg:tw-block">
        <DropPfp pfpUrl={drop.author.pfp} />
      </div>
      <div className="tw-flex tw-flex-col tw-w-full">
        <div className="tw-flex tw-gap-x-3">
          <div className="lg:tw-hidden">
            <DropPfp pfpUrl={drop.author.pfp} />
          </div>
          <div className="tw-w-full tw-inline-flex tw-justify-between">
            <DropAuthor
              handle={drop.author.handle}
              timestamp={drop.created_at}
            />
          </div>
        </div>
        <div className="tw-mt-1">
          {drop.title && (
            <p className="tw-font-semibold tw-text-indigo-400 tw-text-md tw-mb-1">
              {drop.title}
            </p>
          )}
          <div className="tw-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
