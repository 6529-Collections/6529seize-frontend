import { useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
  file: string;
}

export default function PdfViewer({ file }: Readonly<Props>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfUrlWithPage = `${file}`;

  return (
    <Container className="no-padding" ref={containerRef}>
      <Row>
        <Col>
          <iframe
            key={pdfUrlWithPage}
            src={pdfUrlWithPage}
            width="100%"
            height="600px"
            style={{ border: "none" }}
            title={file}
          />
        </Col>
      </Row>
    </Container>
  );
}
