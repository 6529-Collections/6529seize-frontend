import { useContext, useEffect, useState } from "react";
import { AllowlistOperation } from "../../allowlist-tool.types";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";

export default function AllowlistToolBuilderOperationsPending() {
  const { operations } = useContext(AllowlistToolBuilderContext);
  const [pendingOperations, setPendingOperations] = useState<
    AllowlistOperation[]
  >([]);

  useEffect(() => {
    setPendingOperations(
      operations.filter((operation) => !operation.activeRunId)
    );
  }, [operations]);

  return (
    <>
      {pendingOperations.map((operation) => (
        <div key={operation.id} className="tw-flex tw-items-center tw-text-xs">
          {operation.code}
        </div>
      ))}
    </>
  );
}
