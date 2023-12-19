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
  children,
}: {
  readonly tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  readonly hideSeized: boolean;
  readonly hideNonSeized: boolean;
  readonly setHideSeized: (hide: boolean) => void;
  readonly setHideNonSeized: (hide: boolean) => void;
  readonly hideGradients: boolean;
  readonly setHideGradients: (hide: boolean) => void;
  readonly hideMemes: boolean;
  readonly setHideMemes: (hide: boolean) => void;
  readonly sort: UserCollectionSort;
  readonly setSort: (sort: UserCollectionSort) => void;
  readonly sortDir: SortDirection;
  readonly setSortDir: (sortDir: SortDirection) => void;
  readonly seasons: Season[];
  readonly selectedSeason: number;
  readonly setSelectedSeason: (season: number) => void;
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <Row className="tw-mt-8">
        <Col xs={5}>
          <Col xs={12}>
            Sort&nbsp;&nbsp;
            <FontAwesomeIcon
              icon="chevron-circle-up"
              onClick={() => setSortDir(SortDirection.ASC)}
              className={`${styles.sortDirection} ${
                sortDir !== SortDirection.ASC ? styles.disabled : ""
              }`}
            />{" "}
            <FontAwesomeIcon
              icon="chevron-circle-down"
              onClick={() => setSortDir(SortDirection.DESC)}
              className={`${styles.sortDirection} ${
                sortDir !== SortDirection.DESC ? styles.disabled : ""
              }`}
            />
          </Col>
          <Col xs={12} className="pt-2">
            <button
              onClick={() => setSort(UserCollectionSort.ID)}
              className={`${styles.sort} ${
                sort !== UserCollectionSort.ID ? styles.disabled : ""
              } tw-bg-transparent tw-border-none`}
            >
              ID
            </button>
            <button
              onClick={() => setSort(UserCollectionSort.TDH)}
              className={`${styles.sort} ${
                sort !== UserCollectionSort.TDH ? styles.disabled : ""
              } tw-bg-transparent tw-border-none`}
            >
              TDH
            </button>
            <button
              onClick={() => setSort(UserCollectionSort.RANK)}
              className={`${styles.sort} ${
                sort !== UserCollectionSort.RANK ? styles.disabled : ""
              }  tw-bg-transparent tw-border-none`}
            >
              RANK
            </button>
          </Col>
        </Col>
        <Col className="d-flex align-items-center justify-content-end" xs={7}>
          {children}
        </Col>
      </Row>
      <Row className="pt-3">
        <Col xs={6}>
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
        <Col className="d-flex align-items-center justify-content-end" xs={6}>
          <SeasonsDropdown
            seasons={seasons.map((s) => s.season)}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
          />
        </Col>
      </Row>
    </>
  );
}
