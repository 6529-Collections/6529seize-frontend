import {
  AllowlistOperationCode,
  AllowlistOperationDescription,
} from "../../../allowlist-tool.types";

export default function AllowlistToolBuilderAddModalSelectOperation({
  operations,
  selectedOperation,
  onChange,
}: {
  selectedOperation: AllowlistOperationDescription | null;
  operations: AllowlistOperationDescription[];
  onChange: (operation: AllowlistOperationCode) => void;
}) {
  const handleOperationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onChange(event.target.value as AllowlistOperationCode);
  };

  return (
    <div className="tw-mt-5">
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
        Operation
      </label>
      <div className="tw-mt-1 tw-rounded-md tw-shadow-sm tw-bg-neutral-800">
        <select
          className="tw-block tw-w-full tw-rounded-none tw-pl-3 tw-pr-10 tw-py-2 tw-text-base tw-border-neutral-700 tw-focus:outline-none tw-focus:ring-neutral-500 tw-focus:border-neutral-500 tw-transition tw-ease-in-out tw-duration-150 tw-text-neutral-200 tw-bg-neutral-800 tw-border"
          value={selectedOperation?.code || ""}
          onChange={handleOperationChange}
        >
          <option value="" disabled hidden>
            Select operation
          </option>
          {operations.map((operation) => (
            <option
              key={operation.code}
              value={operation.code}
              className="tw-bg-neutral-800"
            >
              {operation.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
