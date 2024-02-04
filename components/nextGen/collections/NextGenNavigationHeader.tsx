import styles from "./NextGen.module.scss";

import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import Image from "next/image";

export enum NextGenView {
  COLLECTIONS = "Collections",
  ARTISTS = "Artists",
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
      <h4 className={`mb-0 pb-2 font-color unselectable`} style={styles}>
        <b>{v ?? "Featured"}</b>
      </h4>
    );
    if (props.view == v) {
      return viewHeader;
    }
    return (
      <button
        className="btn-link"
        onClick={() => {
          if (props.setView) {
            props.setView(v);
          } else {
            window.location.href = `/nextgen/${v?.toLowerCase()}`;
          }
        }}>
        {viewHeader}
      </button>
    );
  }

  return (
    <>
      <Container className={styles.navigationHeader}>
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
          </span>
        </div>
      </Container>
      <hr className="mt-0 mb-0" />
    </>
  );
}
