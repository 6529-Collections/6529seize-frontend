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
        <div className="tw-bg-neutral-900">
          <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
            <div className="tw-flow-root">
              <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
                <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle">
                  <table className="tw-min-w-full tw-divide-y tw-divide-neutral-800">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-white"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-3.5 tw-text-left tw-text-sm tw-font-semibold text-white"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="tw-relative tw-py-3.5 tw-pl-3 tw-pr-4"
                        >
                          <span className="sr-only">Delete</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-neutral-800">
                      
                      {allowlists.map((allowlist) => (
            <AllowlistToolAllowlistsTableItem
              key={allowlist.id}
              allowlist={allowlist}
              onAllowlistRemoved={onAllowlistRemoved}
            />
          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      
          
      
      </div>
    </>
  );
}
