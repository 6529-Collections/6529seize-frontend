import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import AllowlistToolModelWrapper from "./common/AllowlistToolModelWrapper";
import { AllowlistDescription } from "./allowlist-tool.types";

const AddAllowlistModal = dynamic(
  () => import("./AllowlistToolAddAllowlistModal"),
  {
    ssr: false,
  }
);

export default function AllowlistToolHeader() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const router = useRouter();

  const onAllowlistAdded = (allowlist: AllowlistDescription) => {
    router.push(`/allowlist-tool/${allowlist.id}`)
  };

  return (
    <>
      <div className="tw-flex tw-justify-between tw-items-center">
        <h1 className="tw-uppercase">Allowlists</h1>
        <button
          onClick={() => setShowModal(true)}
          type="button"
          className="tw-inline-flex tw-items-center tw-gap-x-2 tw-px-4 tw-py-2.5 tw-bg-primary-500 tw-text-white tw-font-medium tw-text-sm tw-border tw-border-primary-500tw-rounded-lg hover:tw-bg-primary-600hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-h-5 tw-w-5 -tw-ml-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New allowlist
        </button>
      </div>
      <AllowlistToolModelWrapper showModal={showModal} onClose={() => setShowModal(false)} title="Add allowlist">
        <AddAllowlistModal
          onAllowlistAdded={onAllowlistAdded}
        />
      </AllowlistToolModelWrapper>
    </>
  );
}
