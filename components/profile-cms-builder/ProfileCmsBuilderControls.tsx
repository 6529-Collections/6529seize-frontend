"use client";

export function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold ${
        active
          ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
          : "tw-border-transparent tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function BuilderActionButton({
  describedBy,
  disabled,
  label,
  onClick,
  variant = "secondary",
}: {
  readonly describedBy?: string | undefined;
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: "primary" | "secondary" | undefined;
}) {
  return (
    <button
      aria-describedby={describedBy}
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${
        variant === "primary"
          ? "tw-border-primary-400 tw-bg-primary-600 tw-text-white"
          : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-100 hover:tw-border-primary-400"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function focusField(fieldId: string): void {
  const element = globalThis.document?.getElementById(fieldId);
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in element && typeof element.focus === "function") {
    element.focus();
  }
}
