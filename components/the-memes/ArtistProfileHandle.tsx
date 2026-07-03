import Link from "next/link";
import type { BaseNFT } from "@/entities/INFT";

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
        <Link href={`/${handle}`} key={handle} className="tw-no-underline">
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

  return <span className="tw-text-[#9a9a9a]">not available</span>;
}
