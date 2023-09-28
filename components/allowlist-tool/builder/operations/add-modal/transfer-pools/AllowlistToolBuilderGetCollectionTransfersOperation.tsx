import { useState } from "react";
import { AllowlistOperationCode } from "../../../../allowlist-tool.types";
import { getRandomObjectId } from "../../../../../../helpers/AllowlistToolHelpers";
import styles from "../../../../AllowlistTool.module.scss";
import AllowlistToolPrimaryBtn from "../../../../common/AllowlistToolPrimaryBtn";

export default function AllowlistToolBuilderGetCollectionTransfersOperation({
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
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    contract: string;
    blockNo: string;
  }>({
    name: "",
    description: "",
    contract: "",
    blockNo: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addOperation({
      code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
      params: {
        id: getRandomObjectId(),
        name: formValues.name,
        description: formValues.description,
        contract: formValues.contract,
        blockNo: +formValues.blockNo,
      },
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
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Block number
          </label>
          <div className="tw-mt-1.5">
            <input
              type="number"
              name="blockNo"
              value={formValues.blockNo}
              onChange={handleChange}
              required
              autoComplete="off"
              className={`tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
            />
          </div>
        </div>
        <div className="tw-col-span-1">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Contract number
          </label>
          <div className="tw-mt-1.5">
            <input
              type="text"
              name="contract"
              value={formValues.contract}
              onChange={handleChange}
              required
              autoComplete="off"
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
