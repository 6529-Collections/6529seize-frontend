export function GrantErrorDetails({ message }: Readonly<{ message: string }>) {
  return (
    <section
      aria-live="polite"
      className="tw-rounded-lg tw-border tw-border-red-500/40 tw-bg-red-500/5 tw-p-3 tw-text-red-200"
    >
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-red-300 group-data-[typography=profile]/profile-xtdh:tw-text-[11px] group-data-[typography=profile]/profile-xtdh:tw-font-medium">
        Error details
      </p>
      <p className="tw-m-0 tw-mt-1 tw-whitespace-pre-line tw-text-sm group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-font-normal">
        {message}
      </p>
    </section>
  );
}
