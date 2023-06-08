import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperation,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";

import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import { useAnimate } from "framer-motion";
import AllowlistToolBuilderOperationsList from "./AllowlistToolBuilderOperationsList";

export default function AllowlistToolBuilderOperations() {
  const router = useRouter();
  const { operations, setOperations, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOperations() {
      setIsLoading(true);
      setOperations([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`
        );
        const data: AllowlistToolResponse<AllowlistOperation[]> =
          await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setOperations(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchOperations();
  }, [router.query.id, setOperations, setToasts]);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleIsOpen = () => {
    setIsOpen((isOpen) => !isOpen);
  };
  const [sidebarScope, animateSidebar] = useAnimate();
  useEffect(() => {
    if (isOpen) {
      animateSidebar(sidebarScope.current, {
        width: 0,
        transition: { duration: 0.2 },
      });
    } else {
      animateSidebar(sidebarScope.current, {
        width: "17.5rem",
        transition: { duration: 0.2 },
      });
    }
  }, [isOpen, animateSidebar, sidebarScope]);
  return (
    <>
      <div ref={sidebarScope} className="tw-hidden">
        {/*   <button
          className="tw-absolute -tw-left-12 tw-hidden"
          onClick={toggleIsOpen}
        >
          toggle
        </button> */}
        <div className="tw-hidden">
          <AllowlistToolBuilderOperationsList operations={operations} />
        </div>
        </div>
        
        <div className="tw-absolute tw-left-0 -tw-z-0 tw-inset-y-0 tw-w-80 tw-bg-neutral-900 tw-overflow-y-auto  tw-ring-1 tw-ring-white/5">
          <div className="tw-pt-8 tw-pb-4 tw-flex tw-flex-col tw-gap-y-5 tw-bg-neutral-900 tw-px-5">
            <div>
              <span className="tw-text-lg tw-font-medium tw-text-white">
                Operations
              </span>
              <div className="tw-mt-2">
                <button
                  type="submit"
                  className="tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-font-medium tw-text-sm tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
                >
                  Run operations
                </button>
              </div>
            </div>

            <ul
              role="list"
              className="tw-mt-4 tw-ml-0 tw-pl-0 tw-list-none tw-flex tw-flex-1 tw-flex-col tw-gap-y-6"
            >

              <li className="tw-p-5 tw-rounded-lg tw-bg-neutral-800/50">
                <div className="tw-flex tw-items-center tw-gap-x-3.5">
                  <svg
                    className="tw-h-5 tw-w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      className="tw-text-neutral-700"
                      width="24"
                      height="24"
                      rx="12"
                      fill="currentColor"
                    />
                    <path
                      className="tw-text-neutral-500"
                      d="M7.5 12L10.5 15L16.5 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
                    Add phase
                  </span>
                </div>
                <div className="tw-mt-3 tw-flex tw-flex-col">
                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-200">
                        Phase name
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-300">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-300">
                        Allowlist phase 1 etc etc etc etc etc etc
                      </span>
                    </div>
                  </div>

                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-200">
                        Description
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-300">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-300">
                        memes collection phase 1
                      </span>
                    </div>
                  </div>
                </div>
              </li>

              <li className="tw-p-5 tw-rounded-lg tw-bg-neutral-800/50">
                <div className="tw-flex tw-items-center tw-gap-x-3.5">
                  <svg
                    className="tw-h-5 tw-w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      className="tw-text-success"
                      width="24"
                      height="24"
                      rx="12"
                      fill="currentColor"
                    />
                    <path
                      className="tw-text-white"
                      d="M7.5 12L10.5 15L16.5 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span className="tw-text-sm tw-font-medium tw-text-neutral-400">
                    Create Custom Token pool
                  </span>
                </div>
                <div className="tw-mt-3 tw-flex tw-flex-col">
                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-400">
                        Phase name
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-500">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-500">
                        Memes collection Team
                      </span>
                    </div>
                  </div>

                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-400">
                        Description
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-500">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-500">
                        Transfers of the memes
                      </span>
                    </div>
                  </div>

                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-400">
                        Contract No
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-500">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-500">
                        0x33...fd42
                      </span>
                    </div>
                  </div>

                  <div className="tw-flex tw-gap-x-1">
                    <div className="tw-w-20">
                      <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-400">
                        Block No
                      </span>
                    </div>
                    <div className="max-w-[10rem] tw-truncate tw-text-neutral-500">
                      <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-500">
                        17185669
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            
            </ul>
          </div>
        </div>
    
    </>
  );
}
