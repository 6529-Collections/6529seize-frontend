import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

export default function AllowlistToolBuilderPhasesAdd() {
  const router = useRouter();
  const { operations, setOperations, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
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

  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: AllowlistOperationCode.ADD_PHASE,
        params: {
          id: getRandomObjectId(),
          name: formValues.name,
          description: formValues.description,
        },
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
        }
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
        <div className="tw-flex-1 tw-max-w-[15.25rem]">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Phase name
          </label>
          <div className="tw-mt-2">
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white  tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Add phase
          </button>
        </div>
      </div>
    </form>
  );
}
