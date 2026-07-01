import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import { getLeaderboardDownloadFileName } from "./leaderboard_helpers";
import Pagination from "../pagination/Pagination";

function LeaderboardDownload(
  props: Readonly<{
    url: string;
    name: string;
    page: number;
    block?: number | undefined;
  }>
) {
  return (
    <>
      <DownloadUrlWidget
        preview="Download Page"
        name={getLeaderboardDownloadFileName(
          props.name,
          props.block ?? 0,
          props.page
        )}
        url={`${props.url}&download_page=true`}
      />
      <DownloadUrlWidget
        preview="Download All Pages"
        name={getLeaderboardDownloadFileName(props.name, props.block ?? 0, 0)}
        url={`${props.url}&download_all=true`}
      />
    </>
  );
}
export default function LeaderboardFooter(
  props: Readonly<{
    url: string;
    totalResults: number;
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
    block?: number | undefined;
  }>
) {
  if (props.totalResults == 0 || !props.url) {
    return <></>;
  }

  return (
    <div className="tw-container tw-mx-auto tw-px-3">
      <div className="tw-flex tw-flex-col md:tw-flex-row">
        <div className="tw-flex tw-w-full tw-justify-center tw-gap-4 tw-pb-3 tw-pt-4 md:tw-w-1/2">
          <LeaderboardDownload
            url={props.url}
            name="network-interactions"
            page={props.page}
            block={props.block}
          />
        </div>
        {props.totalResults > props.pageSize && (
          <div className="tw-flex tw-w-full tw-justify-center tw-pb-3 tw-pt-4 md:tw-w-1/2">
            <Pagination
              page={props.page}
              pageSize={props.pageSize}
              totalResults={props.totalResults}
              setPage={function (newPage: number) {
                props.setPage(newPage);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
