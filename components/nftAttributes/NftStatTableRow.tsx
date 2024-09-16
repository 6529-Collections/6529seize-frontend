import { numberWithCommas } from "../../helpers/Helpers";

export function NftStatTableRow(props: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number;
}) {
  const decimals = props.decimals ?? 1000;
  const value = Math.round(props.value * decimals) / decimals;
  return (
    <tr>
      <td>{props.label}</td>
      <td>{value > 0 ? `${numberWithCommas(value)} ETH` : `N/A`}</td>
    </tr>
  );
}
