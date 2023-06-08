import dynamic from "next/dynamic";
import { AllowlistDescription } from "./allowlist-tool.types";

const AllowlistToolAllowlistsTableItem = dynamic(
  () => import("./AllowlistToolAllowlistsTableItem"),
  {
    ssr: false,
  }
);

export default function AllowlistToolAllowlistsTable({
  allowlists,
  onAllowlistRemoved,
}: {
  allowlists: AllowlistDescription[];
  onAllowlistRemoved: (id: string) => void;
}) {
  return (
    <>
      <div className="tw-pt-6">
        <ul
          role="list"
          className="tw-list-none tw-pl-0 tw-ml-0 tw-rounded-lg  tw-divide-white/5  tw-gap-y-4 tw-flex tw-flex-col"
        >
          {allowlists.map((allowlist) => (
            <AllowlistToolAllowlistsTableItem
              key={allowlist.id}
              allowlist={allowlist}
              onAllowlistRemoved={onAllowlistRemoved}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
