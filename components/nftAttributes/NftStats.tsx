import { numberWithCommas } from "../../helpers/Helpers";

import { LabNFT, NFT } from "../../entities/INFT";

export function NftPageStats(props: {
  readonly nft: NFT | LabNFT;
  readonly hide_mint_price?: boolean;
  readonly hide_hodl_rate?: boolean;
}) {
  const hasHodlRate = !props.hide_hodl_rate && "hodl_rate" in props.nft;
  return (
    <>
      {!props.hide_mint_price && (
        <NftStatTableRow
          label="Mint Price"
          value={props.nft.mint_price}
          decimals={100000}
        />
      )}
      {hasHodlRate && (
        <NftStatTableRow
          label="TDH Rate"
          value={props.nft.hodl_rate}
          decimals={100}
        />
      )}
      <NftStatTableRow label="Floor Price" value={props.nft.floor_price} />
      <NftStatTableRow
        label="Market Cap"
        value={props.nft.market_cap}
        decimals={100}
      />
      <NftStatTableRow label="Highest Offer" value={props.nft.highest_offer} />
    </>
  );
}

function NftStatTableRow(props: {
  readonly label: string;
  readonly value: number;
  readonly decimals?: number;
}) {
  const decimals = props.decimals ?? 1000;
  const value = Math.round(props.value * decimals) / decimals;
  return (
    <tr>
      <td>{props.label}</td>
      <td>
        <b>{value > 0 ? `${numberWithCommas(value)} ETH` : `N/A`}</b>
      </td>
    </tr>
  );
}