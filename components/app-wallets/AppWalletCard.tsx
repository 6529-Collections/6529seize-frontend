import styles from "./AppWallet.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";
import type { AppWallet } from "./AppWalletsContext";
import AppWalletAvatar from "./AppWalletAvatar";

export default function AppWalletCard(
  props: Readonly<{
    wallet: AppWallet;
  }>
) {
  return (
    <Link
      href={`/tools/app-wallets/${props.wallet.address}`}
      className="decoration-none">
      <Container className={styles["appWalletCard"]}>
        <Row>
          <Col className="text-break d-flex align-items-center gap-2">
            <AppWalletAvatar address={props.wallet.address} />
            <span className="font-larger font-bolder">{props.wallet.name}</span>
            {props.wallet.imported ? (
              <span className="font-color-h"> (imported)</span>
            ) : (
              <></>
            )}
          </Col>
        </Row>
        <Row className="pt-3">
          <Col className="font-smaller font-lighter text-break">
            {props.wallet.address.toLowerCase()}
          </Col>
        </Row>
      </Container>
    </Link>
  );
}
