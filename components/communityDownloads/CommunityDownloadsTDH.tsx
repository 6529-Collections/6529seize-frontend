import CommunityDownloadsComponent from "./CommunityDownloadsComponent";

interface Props {
  view: VIEW;
}

export enum VIEW {
  CONSOLIDATION,
  WALLET,
}

export default function CommunityDownloadsTDH(props: Readonly<Props>) {
  const url = `${process.env.API_ENDPOINT}/api/${
    props.view === VIEW.WALLET ? "uploads" : "consolidated_uploads"
  }`;
  const title = props.view === VIEW.CONSOLIDATION ? `Consolidated ` : ``;
  return <CommunityDownloadsComponent title={`${title} Community`} url={url} />;
}
