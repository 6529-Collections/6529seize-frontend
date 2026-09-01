import type { ReactNode } from "react";

import WavesLayout from "@/components/waves/layout/WavesLayout";

export default function WaveLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <WavesLayout>{children}</WavesLayout>;
}
