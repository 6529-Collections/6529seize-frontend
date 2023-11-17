import styles from "./GasRoyalties.module.scss";
import { Row, Col, Dropdown } from "react-bootstrap";
import { DateIntervalsSelection } from "../../enums";
import DotLoader from "../dotLoader/DotLoader";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Image from "next/image";

export enum GasRoyaltiesCollectionFocus {
  MEMES = "memes",
  MEMELAB = "meme-lab",
}

interface HeaderProps {
  title: string;
  fetching: boolean;
  results_count: number;
  date_selection: DateIntervalsSelection;
  from_date?: Date;
  to_date?: Date;
  focus: GasRoyaltiesCollectionFocus;
  setFocus: (focus: GasRoyaltiesCollectionFocus) => void;
  getUrl: () => string;
  setDateSelection: (dateSelection: DateIntervalsSelection) => void;
  setShowDatePicker: (showDatePicker: boolean) => void;
}

export function GasRoyaltiesHeader(props: Readonly<HeaderProps>) {
  return (
    <>
      <Row className="d-flex align-items-center">
        <Col className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            <h1>
              {props.title.toUpperCase()} {props.fetching && <DotLoader />}
            </h1>
          </span>
          {!props.fetching && props.results_count > 0 && (
            <DownloadUrlWidget
              preview=""
              name={`${props.title.toLowerCase()}-${
                props.focus
              }-${props.date_selection.toLowerCase()}`}
              url={`${props.getUrl()}&download=true`}
            />
          )}
        </Col>
      </Row>
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-3">
            <span
              className={`font-larger font-bolder font-color-h ${
                props.focus === GasRoyaltiesCollectionFocus.MEMES
                  ? styles.collectionFocusActive
                  : styles.collectionFocus
              }`}
              onClick={() => props.setFocus(GasRoyaltiesCollectionFocus.MEMES)}>
              The Memes
            </span>
            <span
              className={`font-larger font-bolder font-color-h ${
                props.focus === GasRoyaltiesCollectionFocus.MEMELAB
                  ? styles.collectionFocusActive
                  : styles.collectionFocus
              }`}
              onClick={() =>
                props.setFocus(GasRoyaltiesCollectionFocus.MEMELAB)
              }>
              Meme Lab
            </span>
          </span>
          <Dropdown className={styles.filterDropdown} drop={"down"}>
            <Dropdown.Toggle disabled={props.fetching}>
              {props.date_selection == DateIntervalsSelection.CUSTOM ? (
                <span>
                  {props.from_date &&
                    `from: ${props.from_date.toISOString().slice(0, 10)}`}{" "}
                  {props.to_date &&
                    `to: ${props.to_date.toISOString().slice(0, 10)}`}
                </span>
              ) : (
                props.date_selection
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(DateIntervalsSelection).map((dateSelection) => (
                <Dropdown.Item
                  key={dateSelection}
                  onClick={() => {
                    if (dateSelection !== DateIntervalsSelection.CUSTOM) {
                      props.setDateSelection(dateSelection);
                    } else {
                      props.setShowDatePicker(true);
                    }
                  }}>
                  {dateSelection}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
    </>
  );
}

interface TokenImageProps {
  path: string;
  token_id: number;
  name: string;
  thumbnail: string;
}

export function GasRoyaltiesTokenImage(props: Readonly<TokenImageProps>) {
  return (
    <a
      href={`/${props.path}/${props.token_id}`}
      target="_blank"
      rel="noreferrer">
      <span className="d-flex aling-items-center gap-2">
        <span>
          {props.token_id} - {props.name}
        </span>
        <Image
          loading={"lazy"}
          width={0}
          height={0}
          style={{ width: "auto", height: "40px" }}
          src={props.thumbnail}
          alt={props.name}
          className={styles.nftImage}
        />
      </span>
    </a>
  );
}
