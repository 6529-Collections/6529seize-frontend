import { useRouter } from "next/router";
import AllowlistToolBuilderPhases from "./phases/AllowlistToolBuilderPhases";
import AllowlistToolBuilderResults from "./results/AllowlistToolBuilderResults";
import { useContext, useEffect, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import {
  AllowlistPhaseWithComponentAndItems,
  AllowlistRunStatus,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";

export default function AllowlistToolBuilderPhasesAndResults() {
  const router = useRouter();
  const { allowlist, phases, setPhases, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoading, setShowLoading] = useState<boolean>(true);

  useEffect(() => {
    setShowLoading(
      isLoading ||
        (!!allowlist?.activeRun?.status &&
          [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
            allowlist?.activeRun?.status
          ))
    );
  }, [isLoading, allowlist]);

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
