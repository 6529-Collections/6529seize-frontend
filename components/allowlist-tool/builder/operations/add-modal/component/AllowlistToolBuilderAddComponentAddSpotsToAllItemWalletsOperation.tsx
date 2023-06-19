import { useContext, useState } from "react";
import { AllowlistOperationCode } from "../../../../allowlist-tool.types";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";
import { AllowlistToolBuilderContext } from "../../../AllowlistToolBuilderContextWrapper";

export default function AllowlistToolBuilderComponentAddSpotsToAllItemWalletsOperation({
  componentId,
  addOperation,
  isLoading,
}: {
  componentId: string;
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
    spots: string;
  }>({
    spots: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const spots = +formValues.spots;
    if (spots <= 0) {
      setToasts({ messages: ["Spots must be greater than 0"], type: "error" });
      return;
    }
    await addOperation({
      code: AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
      params: {
        componentId,
        spots,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5 tw-items-end">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Spots
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="spots"
              required
              autoComplete="off"
              value={formValues.spots}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
