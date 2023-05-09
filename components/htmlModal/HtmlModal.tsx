import styles from "./HtmlModal.module.scss";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

interface Props {
  show: boolean;
  title: string;
  link: string;
  setShow(show: boolean): any;
}

export default function HtmlModal(props: Props) {
  const [html, setHtml] = useState("");
  const [htmlError, setHtmlError] = useState(false);

  useEffect(() => {
    fetch(props.link).then((response) => {
      if (response.status == 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
          setHtmlError(false);
        });
      } else {
        setHtmlError(true);
      }
    });
  }, []);

  return (
    <Modal
      size="lg"
      className={styles.modal}
      show={props.show}
      centered={true}
      onHide={() => props.setShow(false)}>
      <Modal.Header>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body
        dangerouslySetInnerHTML={{
          __html: html,
        }}></Modal.Body>
    </Modal>
  );
}
