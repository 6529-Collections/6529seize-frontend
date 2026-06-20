import type { ReactNode } from "react";

export default function MessagesRouteLayout({
  children,
  nativeOverlay,
}: {
  readonly children: ReactNode;
  readonly nativeOverlay: ReactNode;
}) {
  return (
    <>
      {children}
      {nativeOverlay}
    </>
  );
}
