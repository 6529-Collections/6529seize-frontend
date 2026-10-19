import { Suspense } from "react";
import WavesRouteLoading from "@/components/waves/WavesRouteLoading";
import SingleWaveDropLoading from "@/components/waves/drop/SingleWaveDropLoading";

export default function Loading() {
  return (
    <Suspense fallback={<SingleWaveDropLoading />}>
      <WavesRouteLoading />
    </Suspense>
  );
}
