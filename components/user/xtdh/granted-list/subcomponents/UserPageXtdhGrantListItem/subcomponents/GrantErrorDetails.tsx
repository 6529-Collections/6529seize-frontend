export function GrantErrorDetails({ message }: Readonly<{ message: string }>) {
  return (
    <section
      aria-live="polite"
      className="tw-rounded-lg tw-border tw-border-white/[0.04] tw-bg-iron-900/50 tw-p-3 tw-text-iron-300"
    >
      <p className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-text-iron-300">
        Error details
      </p>
      <p className="tw-m-0 tw-mt-1 tw-whitespace-pre-line tw-text-sm">
        {message}
      </p>
    </section>
  );
}
