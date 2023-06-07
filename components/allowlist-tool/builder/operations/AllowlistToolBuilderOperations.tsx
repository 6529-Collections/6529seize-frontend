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
      <div className="tw-w-0 tw-relative" ref={sidebarScope}>
        <button
          className="tw-absolute -tw-left-12 tw-hidden"
          onClick={toggleIsOpen}
        >
          toggle
        </button>
        <div className="tw-hidden">
          <AllowlistToolBuilderOperationsList operations={operations} />
        </div>
        <div className="tw-hidden xl:tw-fixed xl:tw-inset-y-0 tw-right-0 xl:tw-z-0 xl:tw-flex xl:tw-w-72 xl:tw-flex-col">
          <div className="tw-pt-[150px]  tw-flex tw-grow tw-flex-col tw-gap-y-5 tw-overflow-y-auto tw-bg-neutral-900 tw-px-6 tw-ring-1 tw-ring-white/5">
            <span className="tw-text-lg tw-font-semibold tw-text-white">Operations</span>
            <ul
              role="list"
              className="tw-list-none tw-flex tw-flex-1 tw-flex-col tw-gap-y-7"
            >
              <li>
                <ul role="list" className="-tw-mx-2 tw-space-y-1">
                  sisu
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
