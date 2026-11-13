import { Suspense, type ReactNode } from "react";
import { CompetitionRouteProvider } from "@/contexts/CompetitionRouteContext";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import WavesRouteLoading from "@/components/waves/WavesRouteLoading";

// Wave routes render per request: the shell's wave providers, mounted above
// this layout, read the query (`?serialNo=`, `?drop=`) in their server render
// (contexts/ShellSearchParamsContext.tsx). A `connection()` call here would
// come too late to keep Next from prerendering those providers.
export const dynamic = "force-dynamic";

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
