import { useMemo } from "react";
import { ManifoldClaim } from "@/hooks/useManifoldClaim";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  formatEditionSize,
  formatClaimStatus,
  formatClaimCost,
} from "@/helpers/manifoldDisplayHelpers";

interface UseManifoldClaimDisplaysProps {
  manifoldClaim: ManifoldClaim | undefined;
}

interface UseManifoldClaimDisplaysReturn {
  editionSizeDisplay: React.ReactNode;
  statusDisplay: React.ReactNode;
  costDisplay: React.ReactNode;
}

export function useManifoldClaimDisplays({
  manifoldClaim,
}: UseManifoldClaimDisplaysProps): UseManifoldClaimDisplaysReturn {
  const editionSizeDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    
    const formatted = formatEditionSize(manifoldClaim);
    
    if (manifoldClaim.isFinalized) {
      return <>{formatted}</>;
    } else {
      return (
        <>
          {formatted}
          {manifoldClaim.isFetching && (
            <>
              {" "}
              <DotLoader />
            </>
          )}
        </>
      );
    }
  }, [manifoldClaim]);

  const statusDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    return formatClaimStatus(manifoldClaim);
  }, [manifoldClaim]);

  const costDisplay = useMemo(() => {
    if (!manifoldClaim) return <DotLoader />;
    return formatClaimCost(manifoldClaim);
  }, [manifoldClaim]);

  return {
    editionSizeDisplay,
    statusDisplay,
    costDisplay,
  };
}