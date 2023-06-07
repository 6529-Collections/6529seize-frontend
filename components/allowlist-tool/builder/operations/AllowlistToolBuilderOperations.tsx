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
  const { operations, setOperations } = useContext(AllowlistToolBuilderContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOperations() {
      setIsLoading(true);
      setErrors([]);
      setOperations([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/operations`
        );
        const data: AllowlistToolResponse<AllowlistOperation[]> =
          await response.json();
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setOperations(data);
        }
      } catch (error: any) {
        setErrors([error.message]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOperations();
  }, [router.query.id, setOperations]);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleIsOpen = () => setIsOpen((isOpen) => !isOpen);
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
        <button className="tw-absolute -tw-left-12" onClick={toggleIsOpen}>
          toggle
        </button>
        <AllowlistToolBuilderOperationsList operations={operations} />
      </div>
    </>
  );
}
