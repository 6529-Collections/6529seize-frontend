import { Suspense, type ReactNode } from "react";
import { CompetitionRouteProvider } from "@/contexts/CompetitionRouteContext";
import WavesLayout from "@/components/waves/layout/WavesLayout";

export default function WavesRouteLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <CompetitionRouteProvider>
        <WavesLayout>{children}</WavesLayout>
      </CompetitionRouteProvider>
    </Suspense>
  );
}
