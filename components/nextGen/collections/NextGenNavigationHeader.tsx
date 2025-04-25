import styles from "./NextGen.module.scss";

import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { LFGButton } from "../../lfg-slideshow/LFGSlideshow";
import CollectionsDropdown from "../../collections-dropdown/CollectionsDropdown";

export enum NextGenView {
  COLLECTIONS = "Collections",
  ARTISTS = "Artists",
  ABOUT = "About",
}

export default function NextGenNavigationHeader(
  props: Readonly<{
    view?: NextGenView | undefined;
    setView?: (view: NextGenView | undefined) => void;
  }>
) {
  const [isMobile, setIsMobile] = useState(false);

  function checkMobile() {
    const screenSize = window.innerWidth;
    if (screenSize <= 750) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }

  useEffect(() => {
    checkMobile();
  }, []);

  useEffect(() => {
    const handleResize = () => checkMobile();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function printView(v: NextGenView | undefined) {
    let styles: any = { borderBottom: "1px solid white", cursor: "default" };
    if (!props.setView || (!v && props.view) || (v && v !== props.view)) {
      styles = {};
    }
    const viewHeader = (
      <h5 className={`mb-0 pb-2 font-color unselectable`} style={styles}>
        <b>{v ?? "Featured"}</b>
      </h5>
    );
    if (props.view == v && props.setView) {
      return viewHeader;
    }
    return (
      <button
        className="btn-link decoration-none"
        onClick={() => {
          if (props.setView) {
            props.setView(v);
          } else {
            let href = "/nextgen";
            if (v) {
              href += `/${v.toLowerCase()}`;
            }
            window.location.href = href;
          }
        }}>
        {viewHeader}
      </button>
    );
  }

  return (
    <>
      <Container
        className={`${styles.navigationHeader} ${
          isMobile ? `flex-column gap-2` : `justify-content-between`
        }`}
        style={{
          height: isMobile ? "auto" : "90px",
          paddingTop: isMobile ? "20px" : "0",
        }}>
        <div className="d-flex align-items-center gap-3">
          <Image
            priority
            width="0"
            height="0"
            className="cursor-pointer"
            style={{
              width: "250px",
              maxWidth: "85vw",
              height: "auto",
            }}
            src="/nextgen-logo.png"
            alt="nextgen"
            onClick={() => {
              if (props.setView) {
                props.setView(undefined);
              } else {
                window.location.href = "/nextgen";
              }
            }}
          />
          <LFGButton contract={"nextgen"} />
        </div>
        <div
          className={`d-flex align-items-center ${
            isMobile
              ? "justify-content-center pt-3 pb-3"
              : "justify-content-end"
          }`}>
          <span className="d-flex gap-4">
            {printView(undefined)}
            {printView(NextGenView.COLLECTIONS)}
            {printView(NextGenView.ARTISTS)}
            {printView(NextGenView.ABOUT)}
          </span>
        </div>
      </Container>
      
      <Container className="d-xl-none pb-3 px-5 pl-md-4 pr-md-0">
        <Row className="justify-content-xs-start justify-content-sm-center justify-content-md-start">
          <Col xs={12} sm="auto" className="px-0">
            <CollectionsDropdown activePage="nextgen" />
          </Col>
        </Row>
      </Container>
      
      <hr className={styles.navigationHeaderHr} />
    </>
  );
}
