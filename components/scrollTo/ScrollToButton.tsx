"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";

const SCROLL_BUTTON_CLASS =
  "tw-fixed tw-bottom-[25px] tw-right-[25px] tw-flex tw-h-10 tw-w-10 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-text-white tw-transition-colors tw-duration-300 desktop-hover:hover:tw-bg-iron-700";

const SCROLL_ICON_CLASS = "tw-h-[25px] tw-w-[25px]";

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
      className={SCROLL_BUTTON_CLASS}
      activeClass="active"
      to={props.to}
      smooth={true}
      offset={props.offset}
      style={{ display: showButton ? "flex" : "none" }}
      duration={250}>
      <FontAwesomeIcon icon={faChevronUp} className={SCROLL_ICON_CLASS} />
    </Link>
  );
}
