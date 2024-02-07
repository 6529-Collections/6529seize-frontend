import styles from "./NextGen.module.scss";

import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import Image from "next/image";

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
        className="btn-link"
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
        <div>
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
      <hr className={styles.navigationHeaderHr} />
    </>
  );
}
