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
        <ul className="tw-pl-0 tw-mb-0 tw-space-y-6 tw-list-none">
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
