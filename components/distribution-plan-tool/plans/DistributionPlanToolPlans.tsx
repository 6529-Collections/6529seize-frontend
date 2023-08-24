import { useEffect, useState } from "react";
import { distributionPlanApiFetch } from "../../../services/distribution-plan-api";
import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanToolPlansLoading from "./DistributionPlanToolPlansLoading";
import DistributionPlanToolPlansNoPlans from "./DistributionPlanToolPlansNoPlans";
import DistributionPlanToolPlansTable from "./DistributionPlanToolPlansTable";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";

export enum State {
  LOADING = "LOADING",
  NO_PLANS = "NO_PLANS",
  HAS_PLANS = "HAS_PLANS",
}

export default function DistributionPlanToolPlans() {
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<AllowlistDescription[]>([]);
  const [state, setState] = useState<State>(State.LOADING);

  useEffect(() => {
    if (loading) {
      setState(State.LOADING);
      return;
    }
    if (!plans.length) {
      setState(State.NO_PLANS);
      return;
    }
    if (plans.length) {
      setState(State.HAS_PLANS);
      return;
    }
  }, [loading, plans]);
  useEffect(() => {
    const getPlans = async () => {
      setLoading(true);
      const data = await distributionPlanApiFetch<AllowlistDescription[]>(
        "/allowlists"
      );

      setPlans(data.data ?? []);
      setLoading(false);
    };
    getPlans();
  }, []);
  return (
    <div className="tw-flex tw-justify-center tw-mt-20">
      {(() => {
        switch (state) {
          case State.LOADING:
            return <DistributionPlanToolPlansLoading />;
          case State.NO_PLANS:
            return <DistributionPlanToolPlansNoPlans />;
          case State.HAS_PLANS:
            return <DistributionPlanToolPlansTable plans={plans} />;
          default:
            assertUnreachable(state);
            return null;
        }
      })()}
    </div>
  );
}
