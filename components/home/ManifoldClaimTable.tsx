import { NftPageStats } from "@/components/nft-attributes/NftStats";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Table } from "react-bootstrap";

interface ManifoldClaimTableProps {
  readonly statusDisplay: React.ReactNode;
  readonly costDisplay: React.ReactNode;
  readonly nft: NFTWithMemesExtendedData;
}

export default function ManifoldClaimTable({
  statusDisplay,
  costDisplay,
  nft,
}: ManifoldClaimTableProps) {
  return (
    <Table bordered={false}>
      <tbody>
        <tr>
          <td>Status</td>
          <td>
            <b>{statusDisplay}</b>
          </td>
        </tr>
        <tr>
          <td>Mint Price</td>
          <td>
            <b>{costDisplay}</b>
          </td>
        </tr>
        <NftPageStats nft={nft} hide_mint_price={true} hide_hodl_rate={true} />
      </tbody>
    </Table>
  );
}
