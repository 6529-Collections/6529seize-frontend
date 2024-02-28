import { BaseNFT } from "../../entities/INFT";

export default function ArtistProfileHandle(
  props: Readonly<{
    nft: BaseNFT;
  }>
) {
  if (props.nft.artist_seize_handle) {
    return (
      <a href={`/${props.nft.artist_seize_handle}`}>
        {props.nft.artist_seize_handle}
      </a>
    );
  }

  return <span className="font-color-h">not available</span>;
}
