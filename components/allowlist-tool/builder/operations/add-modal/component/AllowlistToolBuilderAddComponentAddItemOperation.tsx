import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import { useRouter } from "next/router";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  Pool,
} from "../../../../allowlist-tool.types";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../common/select-menu/AllowlistToolSelectMenu";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";

export default function AllowlistToolBuilderComponentAddItemOperation({
  componentId,
  onClose,
}: {
  componentId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { operations, setOperations, tokenPools, customTokenPools, setToasts } =
    useContext(AllowlistToolBuilderContext);

  const tokenPoolOptions: AllowlistToolSelectMenuOption[] = tokenPools.map(
    (tokenPool) => ({
      title: tokenPool.name,
      subTitle: "Token pool",
      value: tokenPool.id,
    })
  );

  const customTokenPoolOptions: AllowlistToolSelectMenuOption[] =
    customTokenPools.map((customTokenPool) => ({
      title: customTokenPool.name,
      subTitle: "Custom token pool",
      value: customTokenPool.id,
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

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTokenPool) {
      setToasts({ messages: ["Please select a token pool"], type: "error" });
      return;
    }
    setIsLoading(true);

    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;

    const params = {
      id: getRandomObjectId(),
      name: formValues.name,
      description: formValues.description,
      componentId: componentId,
      poolId: selectedTokenPool.value,
      poolType: tokenPools.find(
        (tokenPool) => tokenPool.id === selectedTokenPool.value
      )
        ? Pool.TOKEN_POOL
        : Pool.CUSTOM_TOKEN_POOL,
    };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: AllowlistOperationCode.ADD_ITEM,
        params,
      }),
    })
      .then((response) => response.json())
      .then((data: AllowlistToolResponse<AllowlistOperation>) => {
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setOperations([...operations, data]);
          setFormValues({
            name: "",
            description: "",
          });
          setSelectedTokenPool(null);
          onClose();
        }
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
        <div className="tw-flex-1 tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Item name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              required
              autoComplete="off"
              value={formValues.name}
              onChange={handleChange}
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-flex-1 tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Description
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="tw-bg-primary tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Add operation
          </button>
        </div>
      </div>
      <AllowlistToolSelectMenu
        label="Select token pool"
        placeholder="Select"
        options={options}
        selectedOption={selectedTokenPool}
        setSelectedOption={setSelectedTokenPool}
      />
    </form>
  );
}
