/** A system and the commands to run on it, shown as they are typed. */
type ReleaseCommandRow = {
  readonly system: string;
  readonly commands: readonly string[];
};

/** How to check a download on each system: one row per system. */
export default function ReleaseCommandList({
  rows,
}: {
  readonly rows: readonly ReleaseCommandRow[];
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-divide-y tw-divide-white/[0.06] tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-0">
      {rows.map((row) => (
        <li
          key={row.system}
          className="tw-flex tw-flex-col tw-gap-1 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-4"
        >
          <span className="tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-w-44 sm:tw-flex-none">
            {row.system}
          </span>
          <span className="tw-flex tw-min-w-0 tw-flex-col">
            {row.commands.map((command) => (
              <code
                key={command}
                className="tw-break-all tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100"
              >
                {command}
              </code>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
