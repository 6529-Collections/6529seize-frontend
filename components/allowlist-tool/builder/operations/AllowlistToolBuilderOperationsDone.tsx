import { useContext, useEffect, useState } from "react";
import { AllowlistOperation } from "../../allowlist-tool.types";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";

export default function AllowlistToolBuilderOperationsDone() {
  const { operations } = useContext(
    AllowlistToolBuilderContext
  );
  const [doneOperations, setDoneOperations] = useState<AllowlistOperation[]>(
    []
  );

  useEffect(() => {
    setDoneOperations(
      operations.filter((operation) => !!operation.activeRunId)
    );
  }, [operations]);

  return (
    <>
      {doneOperations.map((operation) => (
        <div key={operation.id} className="tw-flex tw-items-center tw-text-xs">
          {operation.code}
        </div>
      ))}
    </>
  );
}
