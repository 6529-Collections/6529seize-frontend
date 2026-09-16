/** @jsxImportSource react */
import type { ReactNode } from "react";

export default function NativeStartupBoundary({
  isNativeLayout,
  children,
}: {
  readonly isNativeLayout: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div data-native-startup={isNativeLayout ? "ready" : "pending"}>
      <div
        data-native-startup-placeholder="true"
        data-testid="native-startup-placeholder"
        aria-hidden="true"
      >
        <header />
        <div />
        <footer>
          <div />
        </footer>
      </div>
      <div data-native-startup-content="true">{children}</div>
    </div>
  );
}
