import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { AllowlistOperationCode } from "../../../../allowlist-tool.types";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderItemSelectFirstNTokensOperation({
  itemId,
  addOperation,
  isLoading,
}: {
  itemId: string;
  addOperation: ({
    code,
    params,
  }: {
    code: AllowlistOperationCode;
    params: any;
  }) => Promise<{ success: boolean }>;
  isLoading: boolean;
}) {
  const { setToasts } = useContext(AllowlistToolBuilderContext);
  const [formValues, setFormValues] = useState<{
    count: string;
  }>({
    count: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const count = +formValues.count;
    if (count <= 0) {
      setToasts({ messages: ["Count must be greater than 0"], type: "error" });
      return;
    }
    await addOperation({
      code: AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS,
      params: {
        itemId,
        count,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Count
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="count"
              required
              autoComplete="off"
              value={formValues.count}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
      </div>
      <div className="tw-mt-6 tw-flex tw-justify-end">
        <AllowlistToolPrimaryBtn
          onClick={() => {}}
          loading={isLoading}
          type="submit"
        >
          Add operation
        </AllowlistToolPrimaryBtn>
      </div>
    </form>
  );
}
