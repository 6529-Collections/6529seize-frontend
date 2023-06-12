import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../common/select-menu/AllowlistToolSelectMenu";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import { AllowlistOperationCode } from "../../../../allowlist-tool.types";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderCreateTokenPoolOperation({
  addOperation,
  isLoading,
}: {
  addOperation: ({
    code,
    params,
  }: {
    code: AllowlistOperationCode;
    params: any;
  }) => Promise<{ success: boolean }>;
  isLoading: boolean;
}) {
  const { transferPools, setToasts } = useContext(AllowlistToolBuilderContext);
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    tokenIds: string;
  }>({
    name: "",
    description: "",
    tokenIds: "",
  });

  const [selectedTransferPool, setSelectedTransferPool] =
    useState<AllowlistToolSelectMenuOption | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTransferPool) {
      setToasts({
        messages: ["Please select a transfer pool."],
        type: "error",
      });
      return;
    }
    const params: {
      id: string;
      name: string;
      description: string;
      transferPoolId: string;
      tokenIds?: string;
    } = {
      id: getRandomObjectId(),
      name: formValues.name,
      description: formValues.description,
      transferPoolId: selectedTransferPool?.value,
    };

    if (formValues.tokenIds) {
      params.tokenIds = formValues.tokenIds;
    }

    await addOperation({
      code: AllowlistOperationCode.CREATE_TOKEN_POOL,
      params,
    });
  };
  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5">
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Pool name
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Description
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <div className="tw-col-span-1">
          <AllowlistToolSelectMenu
            label="Transfer pool"
            placeholder="Select"
            selectedOption={selectedTransferPool}
            setSelectedOption={setSelectedTransferPool}
            options={transferPools.map((transferPool) => ({
              title: transferPool.name,
              subTitle: null,
              value: transferPool.id,
            }))}
          />
        </div>
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Token ID(s)
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="tokenIds"
              value={formValues.tokenIds}
              onChange={handleChange}
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
