import { useCallback, useEffect, useRef, type ReactNode } from "react";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
  isActive = true,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly isActive?: boolean;
}) {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const handleBack = useCallback(() => {
    onBackRef.current?.();
  }, []);

  useEffect(() => {
    const browserWindow = globalThis.window;
    if (!browserWindow || !isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleBack();
    };

    browserWindow.addEventListener("keydown", handleKeyDown);
    return () => {
      browserWindow.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBack, isActive]);

  return (
    <div
      className="tailwind-scope tw-bg-iron-950"
      data-flow-title={title}>
      <div className="tw-h-full tw-w-full">{children}</div>
    </div>
  );
}
