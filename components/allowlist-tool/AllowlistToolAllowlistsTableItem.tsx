import { useContext, useState } from "react";
import { useRouter } from "next/router";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "./allowlist-tool.types";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const deleteAllowlist = async () => {
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${allowlist.id}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
      });
      if (response.status === 200 && response.statusText === "OK") {
        onAllowlistRemoved(allowlist.id);
        return;
      }

      const data: AllowlistToolResponse<any> = await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
    } catch (error: any) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToAllowlist = () => {
    router.push(`/allowlist-tool/${allowlist.id}`);
  };

  return (
    <>
      <li
        onClick={goToAllowlist}
        className="tw-cursor-pointer tw-relative tw-flex tw-items-center tw-space-x-4 tw-px-4 sm:tw-px-6 tw-py-5 tw-bg-[#1E1E1E] tw-border tw-border-solid tw-border-white/5 tw-rounded-xl hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-min-w-0 tw-flex-auto">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <div className="tw-flex-none tw-rounded-full tw-p-1 tw-text-neutral-500 tw-bg-neutral-100/10">
              <div className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-current"></div>
            </div>
            <div className="tw-min-w-0 tw-text-sm tw-font-semibold tw-leading-6 tw-text-white">
              {allowlist.name}
            </div>
          </div>
          <div className="tw-mt-3">
            <p className="tw-truncate tw-mb-0 tw-text-sm tw-leading-5 tw-text-neutral-400">
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-6">
          <button
            type="button"
            title="Delete"
            onClick={deleteAllowlist}
            className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
          >
            <svg
              className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
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
          <svg
            className="tw-h-5 tw-w-5 tw-flex-none tw-text-neutral-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </li>
    </>
  );
}
