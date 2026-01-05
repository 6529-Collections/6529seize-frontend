import { Container, Row, Col } from "react-bootstrap";
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
    <Container>
      <Row>
        <Col
          xs={12}
          sm={12}
          md={6}
          className="pt-4 pb-3 d-flex justify-content-center gap-4">
          <LeaderboardDownload
            url={props.url}
            name="network-interactions"
            page={props.page}
            block={props.block}
          />
        </Col>
        {props.totalResults > props.pageSize && (
          <Col
            xs={12}
            sm={12}
            md={6}
            className="pt-4 pb-3 d-flex justify-content-center">
            <Pagination
              page={props.page}
              pageSize={props.pageSize}
              totalResults={props.totalResults}
              setPage={function (newPage: number) {
                props.setPage(newPage);
              }}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
}
