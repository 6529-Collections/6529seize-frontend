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
  const { operations, setOperations, tokenPools, customTokenPools } =
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
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTokenPool) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

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
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
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
        <button
          type="submit"
          className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full sm:tw-w-auto tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Add operation
        </button>
      </div>
    </form>
  );
}
