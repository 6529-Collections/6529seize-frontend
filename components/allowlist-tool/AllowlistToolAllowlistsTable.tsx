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
      {allowlists.map((allowlist) => (
        <AllowlistToolAllowlistsTableItem
          key={allowlist.id}
          allowlist={allowlist}
          onAllowlistRemoved={onAllowlistRemoved}
        />
      ))}
    </>
  );
}
