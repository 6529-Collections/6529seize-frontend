"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function TransferModalPfp({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const newSrc = await resolveIpfsUrl(src);
      setResolved(newSrc);
    })();
  }, [src]);

  if (!resolved) {
    return <div className="tw-h-9 tw-w-9 tw-rounded-full tw-bg-white/10" />;
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={36}
      height={36}
      className="tw-rounded-full tw-object-cover"
    />
  );
}
