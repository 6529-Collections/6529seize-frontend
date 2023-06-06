import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../../../pages/allowlist-tool/[id]";
import AllowlistToolSelectMenu, { AllowlistToolSelectMenuOption } from "../../../../common/select-menu/AllowlistToolSelectMenu";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../../allowlist-tool.types";

export default function AllowlistToolBuilderCreateTokenPoolOperation({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const { transferPools, operations, setOperations } = useContext(
    AllowlistToolBuilderContext
  );
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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTransferPool) {
      return;
    }
    setIsLoading(true);
    setErrors([]);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;

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

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
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
            tokenIds: "",
          });
          setSelectedTransferPool(null);
          onClose();
        }
        setIsLoading(false);
      });
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
        <div className="tw-flex-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Pool name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-flex-1">
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

        <div className="tw-flex-1">
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
        <div className="tw-flex-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Token ID(s)
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="tokenIds"
              value={formValues.tokenIds}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
          >
            Add operation
          </button>
        </div>
      </div>
    </form>
  );
}
