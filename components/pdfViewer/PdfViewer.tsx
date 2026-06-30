import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
import useIsMobileScreen from "@/hooks/isMobileScreen";
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
        <Link href={pdfUrlWithPage} target="_blank" rel="noopener noreferrer">
          {name}
        </Link>
      </h3>
    );
  }

  return (
    <Container className="tailwind-scope !tw-px-0">
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
