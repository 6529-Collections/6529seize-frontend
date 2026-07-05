import Link from "next/link";
import type { ReactNode } from "react";
import type { BaseNFT } from "@/entities/INFT";

export default function ArtistProfileHandle(
  props: Readonly<{
    nft: BaseNFT;
  }>
) {
  if (props.nft.artist_seize_handle) {
    const handles = props.nft.artist_seize_handle.split(",");
    const handleElements = handles.reduce<ReactNode[]>((acc, handle, index) => {
      const trimmedHandle = handle.trim();
      acc.push(
        <Link
          href={`/${trimmedHandle}`}
          key={trimmedHandle}
          className="tw-no-underline"
        >
          {trimmedHandle}
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
