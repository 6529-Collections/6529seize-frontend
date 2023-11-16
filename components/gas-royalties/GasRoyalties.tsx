import styles from "./GasRoyalties.module.scss";
import { Row, Col, Dropdown } from "react-bootstrap";
import { DateIntervalsSelection } from "../../enums";
import DotLoader from "../dotLoader/DotLoader";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Image from "next/image";

interface HeaderProps {
  title: string;
  fetching: boolean;
  results_count: number;
  date_selection: DateIntervalsSelection;
  from_date?: Date;
  to_date?: Date;
  getUrl: () => string;
  setDateSelection: (dateSelection: DateIntervalsSelection) => void;
  setShowDatePicker: (showDatePicker: boolean) => void;
}

export function GasRoyaltiesHeader(props: Readonly<HeaderProps>) {
  return (
    <Row className="d-flex align-items-center">
      <Col className="d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center gap-2">
          <h1>
            {props.title.toUpperCase()} {props.fetching && <DotLoader />}
          </h1>
          {!props.fetching && props.results_count > 0 && (
            <DownloadUrlWidget
              preview=""
              name={`${props.title.toLowerCase()}-${props.date_selection.toLowerCase()}`}
              url={`${props.getUrl()}&download=true`}
            />
          )}
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
  );
}

interface TokenImageProps {
  token_id: number;
  name: string;
  thumbnail: string;
}

export function GasRoyaltiesTokenImage(props: Readonly<TokenImageProps>) {
  return (
    <a href={`/the-memes/${props.token_id}`} target="_blank" rel="noreferrer">
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
