import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { AllowlistDescription } from "./allowlist-tool.types";
import { AllowlistToolContext } from "../../pages/allowlist-tool";

export default function AllowlistToolAllowlistsTableItem({
  allowlist,
  onAllowlistRemoved,
}: {
  allowlist: AllowlistDescription;
  onAllowlistRemoved: (id: string) => void;
}) {
  const { setToasts } = useContext(AllowlistToolContext);
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(false);
  const deleteAllowlist = () => {
    setLoading(true);
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
              setToasts({
                messages:
                  typeof data.message === "string"
                    ? [data.message]
                    : data.message,
                type: "error",
              });
            } else {
              setToasts({
                messages: ["Something went wrong. Please try again."],
                type: "error",
              });
            }
          })
          .catch(() =>
            setToasts({
              messages: ["Something went wrong. Please try again."],
              type: "error",
            })
          );
      })
      .finally(() => setLoading(false));
  };

  const goToAllowlist = () => {
    router.push(`/allowlist-tool/${allowlist.id}`);
  };

  return (
    <>
      <tr onClick={goToAllowlist} className="tw-cursor-pointer">
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
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </td>
      </tr>
    </>
  );
}
