import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

interface Props {
  view: VIEW;
}

export default function CommunityDownloadsTDH(props: Props) {
  const url = `${process.env.API_ENDPOINT}/api/${
    props.view === VIEW.WALLET ? "uploads" : "consolidated_uploads"
  }`;
  const title = props.view === VIEW.CONSOLIDATION ? `CONSOLIDATED ` : ``;
  return (
    <CommunityDownloadsComponent
      title={`${title} Community Downloads`}
      url={url}
    />
  );
}
