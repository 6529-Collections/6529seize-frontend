import DropAuthor from "./DropAuthor";
import DropPfp from "./DropPfp";

export default function DropWrapper({
  pfpUrl,
  handle,
  timestamp,
  children,
}: {
  readonly pfpUrl?: string | null;
  readonly handle: string;
  readonly timestamp: number;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <DropPfp pfpUrl={pfpUrl} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor handle={handle} timestamp={timestamp} />
        <div className="tw-mt-1 tw-w-full">{children}</div>
      </div>
    </div>
  );
}
