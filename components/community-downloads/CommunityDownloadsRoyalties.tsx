"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRoyalties() {
  useSetTitle("Royalties | Open Data");

  return (
    <CommunityDownloadsComponent
      title="Royalties"
      url={`${process.env.API_ENDPOINT}/api/royalties/uploads`}
    />
  );
}
