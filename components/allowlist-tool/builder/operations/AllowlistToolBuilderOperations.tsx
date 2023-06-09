import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperation,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";

import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolBuilderOperationsList from "./AllowlistToolBuilderOperationsList";
import AllowlistToolBuilderOperationsRun from "./AllowlistToolBuilderOperationsRun";

export default function AllowlistToolBuilderOperations() {
  const router = useRouter();
  const { operations, setOperations, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOperations() {
      setIsLoading(true);
      setOperations([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`
        );
        const data: AllowlistToolResponse<AllowlistOperation[]> =
          await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setOperations(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchOperations();
  }, [router.query.id, setOperations, setToasts]);

  return (
    <>
      <div className="tw-absolute tw-left-0 -tw-z-0 tw-inset-y-0 tw-w-80 tw-bg-neutral-900 tw-overflow-y-auto  tw-ring-1 tw-ring-white/5">
        <div className="tw-pt-8 tw-pb-4 tw-flex tw-flex-col tw-gap-y-5 tw-bg-neutral-900 tw-px-5">
          <div>
            <span className="tw-text-lg tw-font-medium tw-text-white">
              Operations
            </span>
            <div className="tw-mt-2">
              <AllowlistToolBuilderOperationsRun />
            </div>
          </div>
          <AllowlistToolBuilderOperationsList operations={operations} />
        </div>
      </div>
    </>
  );
}
