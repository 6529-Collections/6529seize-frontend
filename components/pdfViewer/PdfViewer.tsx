import styles from "./PdfViewer.module.scss";
import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import Pagination from "../pagination/Pagination";

interface Props {
  file: string;
}

export default function PdfViewer(props: Readonly<Props>) {
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }, []);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderedPageNumber, setRenderedPageNumber] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  function changePage(p: number) {
    setPageNumber(p);
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const isLoading = renderedPageNumber !== pageNumber;

  return (
    <Container className="no-padding" ref={containerRef}>
      <Row>
        <Col>
          <Document
            file={props.file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(e) => {
              console.log("Error loading PDF", e);
            }}>
            {isLoading && renderedPageNumber ? (
              <Page
                key={renderedPageNumber}
                className={styles.prevPage}
                pageNumber={renderedPageNumber}
                width={containerRef.current?.offsetWidth}
              />
            ) : null}
            <Page
              key={pageNumber}
              pageNumber={pageNumber}
              onRenderSuccess={() => setRenderedPageNumber(pageNumber)}
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
