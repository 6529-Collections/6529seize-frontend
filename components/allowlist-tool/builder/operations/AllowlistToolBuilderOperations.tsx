import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperation,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import AllowlistToolBuilderOperationsDone from "./AllowlistToolBuilderOperationsDone";
import AllowlistToolBuilderOperationsPending from "./AllowlistToolBuilderOperationsPending";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";

export default function AllowlistToolBuilderOperations({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setOperations } = useContext(AllowlistToolBuilderContext);
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
  }, [router.query.id]);
  return (
    <>
      <div className="tw-w-full tw-inline-flex">
        <div className="tw-w-1/4">
          <AllowlistToolBuilderOperationsDone />
        </div>
        <div>{children}</div>
        <div className="tw-w-1/4">
          <AllowlistToolBuilderOperationsPending />
        </div>
      </div>
    </>
  );
}
