import { useRouter } from "next/router";
import AllowlistToolBuilderPhases from "./phases/AllowlistToolBuilderPhases";
import AllowlistToolBuilderResults from "./results/AllowlistToolBuilderResults";
import { useContext, useEffect, useState } from "react";

import {
  AllowlistPhaseWithComponentAndItems,
  AllowlistRunStatus,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import { AllowlistToolBuilderContext } from "../AllowlistToolBuilderContextWrapper";

export default function AllowlistToolBuilderPhasesAndResults() {
  const router = useRouter();
  const { phases, setPhases, setToasts, isGlobalLoading } =
    useContext(AllowlistToolBuilderContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoading, setShowLoading] = useState<boolean>(true);

  useEffect(() => {
    setShowLoading(isLoading || isGlobalLoading);
  }, [isLoading, isGlobalLoading]);

  useEffect(() => {
    async function fetchPhases() {
      setIsLoading(true);
      setPhases([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/phases?withComponentsAndItems=true`
        );
        const data: AllowlistToolResponse<
          AllowlistPhaseWithComponentAndItems[]
        > = await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setPhases(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPhases();
  }, [router.query.id, setPhases, setToasts]);
  return (
    <>
      <AllowlistToolBuilderPhases phases={phases} showLoading={showLoading} />
      <AllowlistToolBuilderResults phases={phases} showLoading={showLoading} />
    </>
  );
}
