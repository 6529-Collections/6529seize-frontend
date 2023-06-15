import styles from "./UserPage.module.scss";
import Image from "next/image";
import { Col, Container, Dropdown, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { MemesExtendedData, NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  isGradientsContract,
  isMemesContract,
  numberWithCommas,
} from "../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { TypeFilter } from "../latest-activity/LatestActivity";
import LatestActivityRow from "../latest-activity/LatestActivityRow";
import { Transaction } from "../../entities/ITransaction";
import { IDistribution } from "../../entities/IDistribution";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import NFTImage from "../nft-image/NFTImage";
import UserPageCollection from "./UserPageCollection";
import UserPageActivity from "./UserPageActivity";
import UserPage from "./UserPage";
import UserPageDistributions from "./UserPageDistributions";

interface Props {
  ownerAddress: `0x${string}` | undefined;
  owned: Owner[];
  view: VIEW;
  consolidatedTDH?: ConsolidatedTDHMetrics;
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  isConsolidation: boolean;
}

export enum Focus {
  COLLECTION,
  ACTIVITY,
  DISTRIBUTIONS,
}

const DISTRIBUTIONS_PAGE_SIZE = 25;

export default function UserPageDetails(props: Props) {
  const [focus, setFocus] = useState<Focus>(Focus.COLLECTION);

  return (
    <Container>
      <Row className="pt-5 pb-5">
        <Col className="d-flex align-items-center justify-content-center">
          <h3
            className={
              focus == Focus.COLLECTION ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.COLLECTION)}>
            Collection
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              focus == Focus.ACTIVITY ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.ACTIVITY)}>
            Activity
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              focus == Focus.DISTRIBUTIONS ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.DISTRIBUTIONS)}>
            Distributions
          </h3>
        </Col>
      </Row>
      <UserPageCollection
        show={focus == Focus.COLLECTION}
        owned={props.owned}
        tdh={props.tdh}
      />
      <UserPageActivity
        show={focus == Focus.ACTIVITY}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
      />
      <UserPageDistributions
        show={focus == Focus.DISTRIBUTIONS}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
        isConsolidation={props.isConsolidation}
      />
    </Container>
  );
}
