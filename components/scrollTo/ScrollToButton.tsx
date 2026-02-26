"use client";

import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link } from "react-scroll";

import styles from "./ScrollToButton.module.scss";

interface Props {
  to: string;
  threshold: number;
  offset: number;
}

export default function ScrollToButton(props: Readonly<Props>) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const target = document.getElementById(props.to);
    function handleScroll() {
      const threshold = props.threshold + (target ? target.offsetTop : 0);

      if (window.pageYOffset > threshold) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Link
      className={styles["btn"]}
      activeClass="active"
      to={props.to}
      smooth={true}
      offset={props.offset}
      style={{ display: showButton ? "flex" : "none" }}
      duration={250}>
      <FontAwesomeIcon icon={faChevronUp} className={styles["icon"]} />
    </Link>
  );
}
