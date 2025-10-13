import { useEffect, type ReactNode } from "react";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
}) {
  useEffect(() => {
    const browserWindow = globalThis.window;
    if (!browserWindow) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onBack();
      }
    };

    browserWindow.addEventListener("keydown", handleKeyDown);
    return () => {
      browserWindow.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack]);

  return (
    <div
      className="tailwind-scope tw-bg-iron-950"
      data-flow-title={title}>
      <div className="tw-h-full tw-w-full">{children}</div>
    </div>
  );
}
