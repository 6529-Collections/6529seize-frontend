export interface CommonTableRowValues {
  readonly value: string;
  readonly key: string;
  readonly alignRight?: true;
}

export default function CommonTableRow({
  values,
}: {
  readonly values: CommonTableRowValues[];
}) {
  return (
    <tr className={"even:tw-bg-iron-900"}>
      {values.map((v) => (
        <td
          key={v.key}
          className={`tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 ${
            v.alignRight ? "tw-text-center" : ""
          }`}
        >
          {v.value}
        </td>
      ))}
    </tr>
  );
}
