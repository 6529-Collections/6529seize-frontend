import Link from "next/link";
import { BaseNFT } from "@/entities/INFT";

export default function ArtistProfileHandle(
  props: Readonly<{
    nft: BaseNFT;
  }>
) {
  if (props.nft.artist_seize_handle) {
    const handles = props.nft.artist_seize_handle.split(",");
    const handleElements = handles.reduce((acc: any, handle, index) => {
      handle = handle.trim();
      acc.push(
        <Link href={`/${handle}`} key={handle}>
          {handle}
        </Link>
      );
      if (index < handles.length - 1) {
        acc.push(", ");
      }
      return acc;
    }, []);

    return <>{handleElements}</>;
  }

  return <span className="font-color-h">not available</span>;
}
