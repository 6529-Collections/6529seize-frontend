import { AllowlistOperation } from "../../allowlist-tool.types";
import AllowlistToolBuilderOperationsListitem from "./AllowlistToolBuilderOperationsListitem";

export default function AllowlistToolBuilderOperationsList({
  operations,
}: {
  operations: AllowlistOperation[];
}) {
  return (
    <div>
      {operations.map((operation) => (
        <AllowlistToolBuilderOperationsListitem
          operation={operation}
          key={operation.id}
        />
      ))}
    </div>
  );
}
