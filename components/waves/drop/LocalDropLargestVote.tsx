import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useInView } from "@/hooks/useInView";
import { useWaveById } from "@/hooks/useWaveById";
import { fetchLargestVotePreview } from "@/services/api/drop-vote-preview-api";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface LocalDropLargestVoteProps {
  readonly drop: ExtendedDrop;
  readonly className?: string | undefined;
  readonly children: (vote: ApiDropVoter) => ReactNode;
}

export default function LocalDropLargestVote({
  drop,
  className = "",
  children,
}: LocalDropLargestVoteProps) {
  const { connectedProfile, activeProfileProxy, isAuthenticated, fetchingProfile } =
    useAuth();
  const [ref, isVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px",
    freezeOnceVisible: false,
  });
  const { wave } = useWaveById(drop.wave.id, { enabled: false });
  const dropId = drop.id.trim();
  const isEligible =
    !fetchingProfile &&
    dropId.length > 0 &&
    drop.drop_type === ApiDropType.Participatory &&
    wave?.id === drop.wave.id &&
    wave.wave.type === ApiWaveType.Rank;
  const { data: largestVote, isError } = useQuery({
    queryKey: [
      QueryKey.DROP_VOTERS,
      {
        dropId,
        pageSize: 1,
        sortDirection: "DESC",
        view: "local-largest-vote",
        viewerId: connectedProfile?.id ?? null,
        proxyId: activeProfileProxy?.id ?? null,
        isAuthenticated: isAuthenticated ?? false,
      },
    ],
    queryFn: ({ signal }) => fetchLargestVotePreview(dropId, signal),
    enabled: isEligible && isVisible,
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <div ref={ref} className={`tw-min-h-px tw-min-w-0 ${className}`}>
      {isEligible && !isError && largestVote ? children(largestVote) : null}
    </div>
  );
}
