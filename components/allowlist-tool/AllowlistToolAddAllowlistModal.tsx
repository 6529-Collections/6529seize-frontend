import { useState } from "react";
import { AllowlistToolResponse } from "./allowlist-tool.types";
import { AllowlistDescription } from "./builder/AllowlistToolBuilderHeader";
import { useRouter } from "next/router";

export default function AllowlistToolAddAllowlistModal({
  onClose,
}: {
  onClose: (addedAllowlistId: string | null) => void;
}) {
  const [formValues, setFormValues] = useState({
    // State to hold the form values
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Event handler for input changes
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
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
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          onClose(data.id);
        }
        setIsLoading(false);
      });
  };

  return (
    <>
      <div className="tw-relative tw-z-10" role="dialog">
        <div
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"
        ></div>

        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
            <div className="tw-relative tw-w-full tw-transform tw-overflow-hidden tw-rounded-xl tw-bg-neutral-900 tw-px-4 tw-pb-4 tw-pt-5 tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-lg sm:tw-p-6">
              <div className="tw-flex tw-justify-between tw-items-center">
                <p className="tw-text-lg tw-text-white tw-font-medium tw-mb-0">
                  Add allowlist
                </p>
                <button
                  onClick={() => onClose(null)}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-neutral-600 tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="tw-mt-5">
                <form onSubmit={handleSubmit}>
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
                        className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
                        placeholder="Short description about allowlist"
                        className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                      />
                    </div>
                  </div>
                  <div className="tw-mt-8 tw-w-full">
                    <button
                      type="submit"
                      style={{ fontSize: "16px !important" }}
                      className="tw-bg-primary tw-px-4 tw-py-3 tw-font-medium tw-text-white tw-w-full tw-border tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover  tw-transition tw-duration-300 tw-ease-out"
                    >
                      Add allowlist
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
