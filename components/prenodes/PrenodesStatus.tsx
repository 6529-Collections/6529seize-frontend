import styles from "./Prenodes.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import Pagination from "../pagination/Pagination";
import { useAccount } from "wagmi";
import { Time } from "../../helpers/time";
import {
  faCheckCircle,
  faLocationDot,
  faWarning,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { getDateDisplay } from "../../helpers/Helpers";

interface Prenode {
  ip: string;
  domain: string;
  city: string;
  country: string;
  tdh_sync: boolean;
  block_sync: boolean;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 20;

export default function PrenodesStatus() {
  const account = useAccount();

  const [page, setPage] = useState<number>(1);

  const [prenodes, setPrenodes] = useState<Prenode[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  function fetchResults() {
    const url = `https://api.seize.io/oracle/prenodes?page=${page}&page_size=${PAGE_SIZE}`;

    fetch(url).then((response) => {
      response.json().then((response: { data: Prenode[]; count: number }) => {
        setPrenodes(response.data);
        setTotalResults(response.count);
      });
    });
  }

  useEffect(() => {
    fetchResults();
  }, [page]);

  function printLocation(prenode: Prenode) {
    let location = "";
    if (prenode.city) {
      location += prenode.city;
    }
    if (prenode.city && prenode.country) {
      location += ", ";
    }
    if (prenode.country) {
      location += prenode.country;
    }

    if (!location) {
      location = "Unknown";
    }
    return (
      <Row className="pt-1">
        <Col className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faLocationDot} height={20} color="" />
          {location}
        </Col>
      </Row>
    );
  }

  function printStatusIcon(icon: IconProp, status: string) {
    return <FontAwesomeIcon icon={icon} className={status} height={22} />;
  }

  function printPrenode(prenode: Prenode) {
    let href = `https://${prenode.domain ?? prenode.ip}/oracle`;
    if (account.address) {
      href += `/address/${account.address}`;
    } else {
      href += "/tdh/total";
    }

    const createdAt: Time = Time.fromString(prenode.created_at.toString());
    const updatedAt: Time = Time.fromString(prenode.updated_at.toString());

    const now = Time.now();

    let updatedAtStatus = styles.error;
    let updatedAtIcon = faXmarkCircle;
    if (now.minusHours(1).lte(updatedAt)) {
      updatedAtStatus = styles.success;
      updatedAtIcon = faCheckCircle;
    } else if (now.minusHours(24).lte(updatedAt)) {
      updatedAtStatus = styles.warning;
      updatedAtIcon = faWarning;
    }

    return (
      <Col xs={12} sm={12} md={6} className="pt-2 pb-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="decoration-none">
          <Container className={`no-padding ${styles.prenode}`}>
            <Row>
              <Col>
                <h5>{prenode.domain ?? prenode.ip}</h5>
              </Col>
            </Row>
            <Row>
              <Col className="font-lighter">
                <i>{prenode.ip}</i>
              </Col>
            </Row>
            {printLocation(prenode)}
            <Row className="pt-3">
              <Col>
                <Table>
                  <tbody>
                    <tr>
                      <td>Register Date</td>
                      <td>
                        <b>{createdAt.toIsoDateTimeString()}</b> (
                        {getDateDisplay(createdAt.toDate())})
                      </td>
                    </tr>
                    <tr>
                      <td>Last Update</td>
                      <td>
                        <b>{updatedAt.toIsoDateTimeString()}</b> (
                        {getDateDisplay(updatedAt.toDate())})
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                <Table>
                  <tbody>
                    <tr>
                      <td>Ping Status</td>
                      <td>{printStatusIcon(updatedAtIcon, updatedAtStatus)}</td>
                    </tr>
                    <tr>
                      <td>TDH Status</td>
                      <td>
                        {printStatusIcon(
                          prenode.tdh_sync ? faCheckCircle : faXmarkCircle,
                          prenode.tdh_sync ? styles.success : styles.error
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>TDH Block Status</td>
                      <td>
                        {printStatusIcon(
                          prenode.block_sync ? faCheckCircle : faXmarkCircle,
                          prenode.block_sync ? styles.success : styles.error
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </a>
      </Col>
    );
  }

  function printPrenodes() {
    if (prenodes.length === 0) {
      return;
    }

    return (
      <Row className="pt-2">
        {prenodes.map((prenode: Prenode) => printPrenode(prenode))}
      </Row>
    );
  }

  return (
    <Container className={`no-padding pt-4 pb-4`}>
      <Row className="pb-3">
        <Col>
          <h1>
            <span className="font-lightest">Prenodes</span> Status{" "}
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className="font-color-h">* All times are in UTC</Col>
      </Row>
      {printPrenodes()}
      {totalResults > 0 && totalResults / PAGE_SIZE > 1 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </Row>
      )}
    </Container>
  );
}
