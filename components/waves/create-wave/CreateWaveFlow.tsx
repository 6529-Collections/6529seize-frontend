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
  readonly isActive?: boolean | undefined;
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
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
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
      className="tailwind-scope tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-iron-950"
      data-flow-title={title}
    >
      {/* Single scroll owner for the create-wave flow. The route (native app)
          renders this inside the app shell, which locks document scroll, so
          without an internal scroll region a tall form leaves the footer
          (Next/Complete) unreachable. The modal reuses this same container
          instead of scrolling on its own. */}
      <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15">
        {children}
      </div>
    </div>
  );
}
