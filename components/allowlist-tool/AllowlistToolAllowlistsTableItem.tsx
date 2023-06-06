import { useState } from "react";
import { useRouter } from "next/router";
import { AllowlistDescription } from "./allowlist-tool.types";

export default function AllowlistToolAllowlistsTableItem({
  allowlist,
  onAllowlistRemoved,
}: {
  allowlist: AllowlistDescription;
  onAllowlistRemoved: (id: string) => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const deleteAllowlist = () => {
    setLoading(true);
    setErrors([]);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${allowlist.id}`;
    fetch(url, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.status === 200 && response.statusText === "OK") {
          onAllowlistRemoved(allowlist.id);
          return;
        }
        response
          .json()
          .then((data) => {
            if ("error" in data) {
              typeof data.message === "string"
                ? setErrors([data.message])
                : setErrors(data.message);
            } else {
              setErrors(["Something went wrong. Please try again."]);
            }
          })
          .catch(() => setErrors(["Something went wrong. Please try again."]));
      })
      .finally(() => setLoading(false));
  };

  const goToAllowlist = () => {
    router.push(`/allowlist-tool/${allowlist.id}`);
  };

  return (
    <>

<tr  onClick={goToAllowlist} className="tw-cursor-pointer">
                        <td className="tw-rounded-l-lg tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white">
                        {allowlist.name}
                        
                        </td>
                        <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-neutral-300">
                          Lorem ipsum dolor sit.
                        </td>
                        <td className="tw-rounded-r-lg tw-relative tw-whitespace-nowrap tw-py-4 tw-pl-3 tw-pr-4 tw-text-right tw-text-sm tw-font-medium">
                          <button
                           onClick={deleteAllowlist}
                            type="button"
                            className="tw-group tw-p-2 tw-rounded-full tw-bg-transparent tw-text-neutral-300 tw-font-medium tw-text-sm tw-border-none hover:tw-text-white hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out"
                          >
                            <svg
                              className="tw-h-5 tw-w-5 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>


      <li
        onClick={goToAllowlist}
        className="tw-cursor-pointer tw-bg-neutral-900 tw-border tw-border-solid tw-border-white/5 tw-divide-y tw-divide-neutral-700 tw-rounded-xl hover:tw-bg-white/5 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-px-5 tw-py-4">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-white">
                <div>{allowlist.name}</div>
                {errors.length > 0 &&
                  errors.map((error, index) => (
                    <div key={`${allowlist.id}-error-${index}`}>{error}</div>
                  ))}
              </p>
              <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-font-normal tw-text-neutral-400">
                Lorem ipsum dolor sit amet consectetur adipisicing.
              </p>
            </div>
            <button
              type="button"
              className="tw-group tw-p-2 tw-rounded-full tw-bg-transparent tw-text-neutral-300 tw-font-medium tw-text-sm tw-border-none hover:tw-text-white hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out"
              onClick={deleteAllowlist}
            >
              <svg
                className="tw-h-5 tw-w-5 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </li>
    </>
  );
}
