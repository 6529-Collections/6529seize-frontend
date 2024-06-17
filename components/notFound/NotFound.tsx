import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";

interface Props {
  title: string;
  links: {
    href: string;
    display: string;
  }[];
}

export default function NotFound(props: Readonly<Props>) {
  return (
    <Container className="pt-5 text-center">
      <Row>
        <Col>
          <h4 className="mb-0 float-none">{props.title}</h4>
        </Col>
      </Row>
      <Row>
        <Col>
          <Image
            width="0"
            height="0"
            style={{ height: "auto", width: "120px" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />
        </Col>
      </Row>
      {props.links.map((link) => (
        <Row className="pt-3" key={`not-found-link-${link.href}`}>
          <Col>
            <a href={link.href}>{link.display}</a>
          </Col>
        </Row>
      ))}
    </Container>
  );
}
