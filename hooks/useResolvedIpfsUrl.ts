import { useQuery } from "@tanstack/react-query";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";

export function useResolvedIpfsUrl(src?: string | null) {
  return useQuery<string | null>({
    queryKey: ["ipfs-url", src],
    queryFn: () => (src ? resolveIpfsUrl(src) : Promise.resolve(null)),
    enabled: !!src,
    staleTime: Infinity,
  });
}
