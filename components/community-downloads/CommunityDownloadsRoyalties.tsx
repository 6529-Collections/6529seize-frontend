import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRoyalties() {
  return (
    <CommunityDownloadsComponent
      title="Royalties"
      url={`${process.env.API_ENDPOINT}/api/royalties/uploads`}
    />
  );
}
