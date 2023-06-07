import { useContext, useState } from "react";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "./allowlist-tool.types";
import { AllowlistToolContext } from "../../pages/allowlist-tool";

export default function AllowlistToolAddAllowlistModal({
  onAllowlistAdded,
}: {
  onAllowlistAdded: (allowlist: AllowlistDescription) => void;
}) {
  const { setToasts } = useContext(AllowlistToolContext);

  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formValues.name,
        description: formValues.description,
      }),
    })
      .then((response) => response.json())
      .then((data: AllowlistToolResponse<AllowlistDescription>) => {
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          onAllowlistAdded(data);
        }
        setIsLoading(false);
      });
  };

  return (
    <div className="tw-mt-5">
      <form onSubmit={handleSubmit} className="px-4 sm:px-6">
        <div>
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-mt-6">
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
              placeholder="Short description about allowlist"
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-mt-8 tw-w-full">
          <button
            type="submit"
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Add allowlist
          </button>
        </div>
      </form>
    </div>
  );
}
