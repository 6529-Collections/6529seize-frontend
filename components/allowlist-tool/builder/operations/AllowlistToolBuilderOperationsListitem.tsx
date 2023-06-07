import { AllowlistOperation } from "../../allowlist-tool.types";

export default function AllowlistToolBuilderOperationsListitem({
  operation,
}: {
  operation: AllowlistOperation;
}) {
  return (
    <div
      className={`tw-flex tw-items-center tw-text-xs ${
        operation.activeRunId ? "tw-text-green-500" : "tw-text-neutral-300"
      }`}
    >
      {operation.code}
    </div>
  );
}
