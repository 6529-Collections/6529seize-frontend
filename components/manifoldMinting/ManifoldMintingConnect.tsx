import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useAccount } from "wagmi";
import HeaderUserConnect from "../header/user/HeaderUserConnect";

export default function ManifoldMintingConnect(
  props: Readonly<{
    onConnect: (address: string) => void;
  }>
) {
  const account = useAccount();

  useEffect(() => {
    props.onConnect(account.address as string);
  }, [account.address]);

  function printContent() {
    if (account.isConnected) {
      return (
        <>
          Minting for <b>{account.address}</b>
        </>
      );
    }
    return <HeaderUserConnect />;
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>{printContent()}</Col>
      </Row>
    </Container>
  );
}
