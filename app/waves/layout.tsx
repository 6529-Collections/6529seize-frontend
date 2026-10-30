import { Suspense, type ReactNode } from "react";
import { CompetitionRouteProvider } from "@/contexts/CompetitionRouteContext";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import WavesRouteLoading from "@/components/waves/WavesRouteLoading";

export default function WavesRouteLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <Suspense fallback={<WavesRouteLoading showSidebar />}>
      <CompetitionRouteProvider>
        <WavesLayout>{children}</WavesLayout>
      </CompetitionRouteProvider>
    </Suspense>
  );
}
