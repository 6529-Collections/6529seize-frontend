import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useAccount } from "wagmi";
import HeaderUserConnect from "../header/user/HeaderUserConnect";

export default function ManifoldMintingConnect(
  props: Readonly<{
    onConnect: (address: string) => void;
  }>
) {
  // const account = useAccount();
  const account = {
    address: "0x5eeeb64d0e697a60e6dacd7ad9a16a6bdd5560e2",
    // address: "0xef26d046370c703a8f954a7ef5834b80efc9d5ad",
    isConnected: true,
  };

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
