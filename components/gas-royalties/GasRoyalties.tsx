import styles from "./GasRoyalties.module.scss";
import { Row, Col, Dropdown, Container } from "react-bootstrap";
import { DateIntervalsSelection } from "../../enums";
import DotLoader from "../dotLoader/DotLoader";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Image from "next/image";
import Tippy from "@tippyjs/react";
import { useState, useEffect } from "react";
import { fetchUrl } from "../../services/6529api";
import { capitalizeEveryWord, getDateFilters } from "../../helpers/Helpers";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import router from "next/router";

export enum GasRoyaltiesCollectionFocus {
  MEMES = "the-memes",
  MEMELAB = "meme-lab",
}

interface HeaderProps {
  title: string;
  description?: string;
  fetching: boolean;
  results_count: number;
  date_selection: DateIntervalsSelection;
  selected_artist: string;
  from_date?: Date;
  to_date?: Date;
  focus: GasRoyaltiesCollectionFocus;
  setFocus: (focus: GasRoyaltiesCollectionFocus) => void;
  getUrl: () => string;
  setSelectedArtist: (artist: string) => void;
  setDateSelection: (dateSelection: DateIntervalsSelection) => void;
  setShowDatePicker: (showDatePicker: boolean) => void;
}

export function getUrlParams(
  apiPath: string,
  dateSelection: DateIntervalsSelection,
  collectionFocus?: GasRoyaltiesCollectionFocus,
  fromDate?: Date,
  toDate?: Date,
  selectedArtist?: string
): string {
  if (!collectionFocus) {
    return "";
  }
  const dateFilters = getDateFilters(dateSelection, fromDate, toDate);
  const collection =
    collectionFocus === GasRoyaltiesCollectionFocus.MEMELAB
      ? "memelab"
      : "memes";
  const artistFilter = selectedArtist ? `&artist=${selectedArtist}` : "";
  return `${process.env.API_ENDPOINT}/api/${apiPath}/collection/${collection}?${dateFilters}${artistFilter}`;
}

export function GasRoyaltiesHeader(props: Readonly<HeaderProps>) {
  const [artists, setArtists] = useState<{ name: string; cards: number[] }[]>(
    []
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  useEffect(() => {
    if (props.focus) {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: props.title },
        {
          display: capitalizeEveryWord(props.focus.replaceAll("-", " ")),
        },
      ]);
      router.push(
        {
          pathname: router.pathname,
          query: {
            focus: props.focus,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [props.focus]);

  useEffect(() => {
    const path =
      props.focus === GasRoyaltiesCollectionFocus.MEMES ? "memes" : "memelab";
    fetchUrl(`${process.env.API_ENDPOINT}/api/${path}/artists_names`).then(
      (
        res: {
          name: string;
          cards: number[];
        }[]
      ) => {
        setArtists(res);
      }
    );
  }, [props.focus]);

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container className="pt-4">
        <Row className="d-flex align-items-center">
          <Col className="d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center gap-2">
              <h1>
                {props.title.toUpperCase()} {props.fetching && <DotLoader />}
              </h1>
            </span>
            <span className="d-flex align-items-center gap-3">
              <span
                className={`font-larger font-bolder font-color-h ${
                  props.focus === GasRoyaltiesCollectionFocus.MEMES
                    ? styles.collectionFocusActive
                    : styles.collectionFocus
                }`}
                onClick={() =>
                  props.setFocus(GasRoyaltiesCollectionFocus.MEMES)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setFocus(GasRoyaltiesCollectionFocus.MEMES);
                  }
                }}
                tabIndex={0}
                aria-label="The Memes">
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
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setFocus(GasRoyaltiesCollectionFocus.MEMELAB);
                  }
                }}
                tabIndex={0}
                aria-label="Meme Lab">
                Meme Lab
              </span>
            </span>
          </Col>
        </Row>
        {props.description && (
          <Row className="pt-3">
            <Col>{props.description}</Col>
          </Row>
        )}
        <Row className="pt-3">
          <Col className="d-flex align-items-center justify-content-between">
            <span>
              {!props.fetching && props.results_count > 0 && (
                <DownloadUrlWidget
                  preview=""
                  name={`${props.title.toLowerCase().replaceAll(" ", "-")}_${
                    props.focus
                  }_${props.date_selection.toLowerCase().replaceAll(" ", "-")}`}
                  url={`${props.getUrl()}&download=true`}
                />
              )}
            </span>
            <span className="d-flex align-items-center gap-5">
              <Dropdown className={styles.filterDropdown} drop={"down"}>
                <Dropdown.Toggle disabled={props.fetching}>
                  Artist: {props.selected_artist || "All"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      props.setSelectedArtist("");
                    }}>
                    All
                  </Dropdown.Item>
                  {artists.map((a) => (
                    <Dropdown.Item
                      key={`artist-${a.name.replaceAll(" ", "-")}`}
                      onClick={() => {
                        props.setSelectedArtist(a.name);
                      }}>
                      {a.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown className={styles.filterDropdown} drop={"down"}>
                <Dropdown.Toggle disabled={props.fetching}>
                  {props.date_selection == DateIntervalsSelection.CUSTOM ? (
                    <span>
                      {props.from_date &&
                        `from: ${props.from_date
                          .toISOString()
                          .slice(0, 10)}`}{" "}
                      {props.to_date &&
                        `to: ${props.to_date.toISOString().slice(0, 10)}`}
                    </span>
                  ) : (
                    props.date_selection
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.values(DateIntervalsSelection).map(
                    (dateSelection) => (
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
                    )
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </span>
          </Col>
        </Row>
      </Container>
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
      <span className="d-flex justify-content-center aling-items-center gap-2">
        <span>{props.token_id} -</span>
        <Tippy
          content={`${props.name}`}
          delay={0}
          placement={"auto"}
          theme={"light"}>
          <Image
            loading={"lazy"}
            width={0}
            height={0}
            style={{ width: "auto", height: "40px" }}
            src={props.thumbnail}
            alt={props.name}
            className={styles.nftImage}
          />
        </Tippy>
      </span>
    </a>
  );
}
