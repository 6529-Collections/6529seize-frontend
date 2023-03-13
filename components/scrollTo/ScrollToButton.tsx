import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import styles from "./ScrollToButton.module.scss";
import { Link } from "react-scroll";

interface Props {
  to: string;
  threshhold: number;
  offset: number;
}

export default function ScrollToButton(props: Props) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const target = document.getElementById(props.to);
    function handleScroll() {
      const threshhold = props.threshhold + (target ? target.offsetTop : 0);
      console.log(threshhold);
      if (window.pageYOffset > threshhold) {
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
      className={styles.btn}
      activeClass="active"
      to={props.to}
      smooth={true}
      offset={props.offset}
      style={{ display: showButton ? "flex" : "none" }}
      duration={250}>
      <FontAwesomeIcon icon="chevron-up" className={styles.icon} />
    </Link>
  );
}
