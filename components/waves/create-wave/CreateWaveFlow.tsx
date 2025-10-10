import { useCallback, type KeyboardEvent, type ReactNode } from "react";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        onBack();
      }
    },
    [onBack]
  );

  return (
    <div
      className="tailwind-scope tw-bg-iron-950"
      data-flow-title={title}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="tw-h-full tw-w-full">{children}</div>
    </div>
  );
}
