import styles from "./SeasonsDropdown.module.scss";
import { Dropdown } from "react-bootstrap";

interface Props {
  seasons: number[];
  selectedSeason: number;
  setSelectedSeason(season: number): void;
}

export default function SeasonsDropdown(props: Readonly<Props>) {
  return (
    <Dropdown className={styles.seasonDropdown} drop={"down-centered"}>
      <Dropdown.Toggle>
        SZN: {props.selectedSeason === 0 ? `All` : props.selectedSeason}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          onClick={() => {
            props.setSelectedSeason(0);
          }}>
          All
        </Dropdown.Item>
        {props.seasons.map((s) => (
          <Dropdown.Item
            key={`season-${s}`}
            onClick={() => {
              props.setSelectedSeason(s);
            }}>
            SZN{s}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
