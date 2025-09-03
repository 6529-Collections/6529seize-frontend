import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Table } from "react-bootstrap";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import { printMintDate } from "@/helpers/Helpers";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";

interface FeaturedNFTDetailsTableProps {
  readonly nft: NFTWithMemesExtendedData;
  readonly editionSizeDisplay: React.ReactNode;
}

export default function FeaturedNFTDetailsTable({
  nft,
  editionSizeDisplay,
}: FeaturedNFTDetailsTableProps) {
  return (
    <Table bordered={false}>
      <tbody>
        <tr>
          <td>Edition Size</td>
          <td>
            <b>{editionSizeDisplay}</b>
          </td>
        </tr>
        <tr>
          <td>Collection</td>
          <td>
            <b>{nft.collection}</b>
          </td>
        </tr>
        <tr>
          <td>Season</td>
          <td>
            <b>{nft.season}</b>
          </td>
        </tr>
        <tr>
          <td>Meme</td>
          <td>
            <b>{nft.meme_name}</b>
          </td>
        </tr>
        <tr>
          <td>Artist Name</td>
          <td>
            <b>{nft.artist}</b>
          </td>
        </tr>
        <tr>
          <td>Artist Profile</td>
          <td>
            <b>
              <ArtistProfileHandle nft={nft} />
            </b>
          </td>
        </tr>
        <tr>
          <td>Mint Date</td>
          <td>
            <b>{printMintDate(nft.mint_date)}</b>
          </td>
        </tr>
        <tr>
          <td>File Type</td>
          <td>
            <b>{getFileTypeFromMetadata(nft.metadata)}</b>
          </td>
        </tr>
        <tr>
          <td>Dimensions</td>
          <td>
            <b>{getDimensionsFromMetadata(nft.metadata)}</b>
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
