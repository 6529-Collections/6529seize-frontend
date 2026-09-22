import type { ReactNode } from "react";
import EmmaAuthGate from "@/components/distribution-plan-tool/EmmaAuthGate";

export default function EmmaPlansLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <EmmaAuthGate>{children}</EmmaAuthGate>;
}
