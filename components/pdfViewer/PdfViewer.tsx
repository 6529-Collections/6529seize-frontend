import { Col, Container, Row } from "react-bootstrap";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import Link from "next/link";

interface Props {
  file: string;
  name: string;
}

export default function PdfViewer({ file, name }: Readonly<Props>) {
  const isMobile = useIsMobileScreen();

  const pdfUrlWithPage = `${file}`;

  if (isMobile) {
    return (
      <h3>
        Open{" "}
        <Link href={pdfUrlWithPage} target="_blank">
          {name}
        </Link>
      </h3>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <iframe
            key={pdfUrlWithPage}
            src={pdfUrlWithPage}
            width="100%"
            height="600px"
            style={{ border: "none" }}
            title={name}
          />
        </Col>
      </Row>
    </Container>
  );
}
