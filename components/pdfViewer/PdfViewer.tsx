import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import Pagination from "../pagination/Pagination";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

interface Props {
  file: string;
}

export default function PdfViewer(props: Readonly<Props>) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  function changePage(p: number) {
    setPageNumber(p);
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col ref={containerRef}>
          <Document file={props.file} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              key={pageNumber}
              pageNumber={pageNumber}
              width={containerRef.current?.offsetWidth}
            />
          </Document>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col className="d-flex justify-content-center gap-2">
          <Pagination
            page={pageNumber}
            pageSize={1}
            totalResults={numPages}
            setPage={function (newPage: number) {
              changePage(newPage);
            }}
          />
        </Col>
      </Row>
    </Container>
  );
}
