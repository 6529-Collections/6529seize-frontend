import { Row, Col } from "react-bootstrap";
import Link from "next/link";
import useCapacitor from "@/hooks/useCapacitor";

export default function AppWalletsUnsupported() {
  const capacitor = useCapacitor();

  return (
    <>
      <Row className="mt-4">
        {capacitor.isCapacitor ? (
          <Col>Update to the latest version of the app to use App Wallets</Col>
        ) : (
          <Col>App Wallets are not supported on this platform</Col>
        )}
      </Row>
      <Row className="mt-4">
        <Col>
          <Link href="/">TAKE ME HOME</Link>
        </Col>
      </Row>
    </>
  );
}
