import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { AllowlistOperationCode, Pool } from "../../../../allowlist-tool.types";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../common/select-menu/AllowlistToolSelectMenu";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderComponentAddItemOperation({
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
  const { tokenPools, customTokenPools, setToasts } = useContext(
    AllowlistToolBuilderContext
  );

  const tokenPoolOptions: AllowlistToolSelectMenuOption[] = tokenPools.map(
    (tokenPool) => ({
      title: tokenPool.name,
      subTitle: "Token pool",
      value: tokenPool.tokenPoolId,
    })
  );

  const customTokenPoolOptions: AllowlistToolSelectMenuOption[] =
    customTokenPools.map((customTokenPool) => ({
      title: customTokenPool.name,
      subTitle: "Custom token pool",
      value: customTokenPool.customTokenPoolId,
    }));

  const options: AllowlistToolSelectMenuOption[] = [
    ...tokenPoolOptions,
    ...customTokenPoolOptions,
  ];

  const [selectedTokenPool, setSelectedTokenPool] =
    useState<AllowlistToolSelectMenuOption | null>(null);

  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTokenPool) {
      setToasts({ messages: ["Please select a token pool"], type: "error" });
      return;
    }
    await addOperation({
      code: AllowlistOperationCode.ADD_ITEM,
      params: {
        id: getRandomObjectId(),
        name: formValues.name,
        description: formValues.description,
        componentId: componentId,
        poolId: selectedTokenPool.value,
        poolType: tokenPools.find(
          (tokenPool) => tokenPool.tokenPoolId === selectedTokenPool.value
        )
          ? Pool.TOKEN_POOL
          : Pool.CUSTOM_TOKEN_POOL,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="tw-px-4 sm:tw-px-6">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-5">
        <div className="tw-col-span-1">
          <AllowlistToolSelectMenu
            label="Select token pool"
            placeholder="Select"
            options={options}
            selectedOption={selectedTokenPool}
            setSelectedOption={setSelectedTokenPool}
          />
        </div>
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Item name
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="name"
              required
              autoComplete="off"
              value={formValues.name}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
