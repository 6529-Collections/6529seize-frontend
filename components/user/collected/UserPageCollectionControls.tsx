import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import styles from "../UserPage.module.scss";
import { Row, Col, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SortDirection } from "../../../entities/ISort";
import SeasonsDropdown from "../../seasons-dropdown/SeasonsDropdown";
import { UserCollectionSort } from "./UserPageCollection";
import { Season } from "../../../entities/ISeason";

export default function UserPageCollectionControls({
  tdh,
  hideSeized,
  hideNonSeized,
  setHideSeized,
  setHideNonSeized,
  hideGradients,
  setHideGradients,
  hideMemes,
  setHideMemes,
  sort,
  setSort,
  sortDir,
  setSortDir,
  seasons,
  selectedSeason,
  setSelectedSeason,
}: {
  tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  hideSeized: boolean;
  hideNonSeized: boolean;
  setHideSeized: (hide: boolean) => void;
  setHideNonSeized: (hide: boolean) => void;
  hideGradients: boolean;
  setHideGradients: (hide: boolean) => void;
  hideMemes: boolean;
  setHideMemes: (hide: boolean) => void;
  sort: UserCollectionSort;
  setSort: (sort: UserCollectionSort) => void;
  sortDir: SortDirection;
  setSortDir: (sortDir: SortDirection) => void;
  seasons: Season[];
  selectedSeason: number;
  setSelectedSeason: (season: number) => void;
}) {
  return (
    <>
      <Row>
        <Col xs={5}>
          <Col xs={12}>
            Sort&nbsp;&nbsp;
            <FontAwesomeIcon
              icon="chevron-circle-up"
              onClick={() => setSortDir(SortDirection.ASC)}
              className={`${styles.sortDirection} ${sortDir !== SortDirection.ASC ? styles.disabled : ""
                }`}
            />{" "}
            <FontAwesomeIcon
              icon="chevron-circle-down"
              onClick={() => setSortDir(SortDirection.DESC)}
              className={`${styles.sortDirection} ${sortDir !== SortDirection.DESC ? styles.disabled : ""
                }`}
            />
          </Col>
          <Col xs={12} className="pt-2">
            <span
              onClick={() => setSort(UserCollectionSort.ID)}
              className={`${styles.sort} ${sort !== UserCollectionSort.ID ? styles.disabled : ""
                }`}
            >
              ID
            </span>
            <span
              onClick={() => setSort(UserCollectionSort.TDH)}
              className={`${styles.sort} ${sort !== UserCollectionSort.TDH ? styles.disabled : ""
                }`}
            >
              TDH
            </span>
            <span
              onClick={() => setSort(UserCollectionSort.RANK)}
              className={`${styles.sort} ${sort !== UserCollectionSort.RANK ? styles.disabled : ""
                }`}
            >
              RANK
            </span>
          </Col>
        </Col>
        <Col className="d-flex align-items-center justify-content-end" xs={7}>
          <SeasonsDropdown
            seasons={seasons.map((s) => s.season)}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
          />
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Form.Check
            type="radio"
            name="hide"
            checked={!hideSeized && !hideNonSeized}
            className={`${styles.seizedToggle}`}
            label={`All`}
            onChange={() => {
              setHideSeized(false);
              setHideNonSeized(false);
            }}
          />
          <Form.Check
            type="radio"
            checked={!hideSeized && hideNonSeized}
            className={`${styles.seizedToggle}`}
            name="hide"
            label={`Seized`}
            onChange={() => {
              setHideSeized(false);
              setHideNonSeized(true);
            }}
          />
          <Form.Check
            type="radio"
            checked={hideSeized && !hideNonSeized}
            className={`${styles.seizedToggle}`}
            name="hide"
            label={`Unseized`}
            onChange={() => {
              setHideSeized(true);
              setHideNonSeized(false);
            }}
          />
          {tdh && tdh.memes_balance > 0 && tdh.gradients_balance > 0 && (
            <>
              <Form.Check
                type="switch"
                className={`${styles.seizedToggle}`}
                label={`Hide Gradients`}
                checked={hideGradients}
                onChange={() => {
                  setHideGradients(!hideGradients);
                }}
              />
              <Form.Check
                type="switch"
                className={`${styles.seizedToggle}`}
                label={`Hide Memes`}
                checked={hideMemes}
                onChange={() => {
                  setHideMemes(!hideMemes);
                }}
              />
            </>
          )}
        </Col>
      </Row>
    </>
  );
}
