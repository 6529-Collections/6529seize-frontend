import { Suspense, type ReactNode } from "react";
import { CompetitionRouteProvider } from "@/contexts/CompetitionRouteContext";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import StreamRouteLoadingShell from "@/components/brain/my-stream/layout/StreamRouteLoadingShell";

export default function WavesRouteLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <StreamRouteLoadingShell ariaLabel="Loading waves" variant="waves" />
      }
    >
      <CompetitionRouteProvider>
        <WavesLayout>{children}</WavesLayout>
      </CompetitionRouteProvider>
    </Suspense>
  );
}
