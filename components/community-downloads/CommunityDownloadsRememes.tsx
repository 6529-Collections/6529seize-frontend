import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

export default function CommunityDownloadsRememes() {
  return (
    <CommunityDownloadsComponent
      title="Rememes"
      url={`${process.env.API_ENDPOINT}/api/rememes_uploads`}
    />
  );
}
