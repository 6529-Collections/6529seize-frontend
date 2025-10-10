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
    if (typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
