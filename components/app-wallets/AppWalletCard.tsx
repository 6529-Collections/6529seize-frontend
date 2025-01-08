import styles from "./AppWallet.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";
import { AppWallet } from "../../hooks/useCapacitor";

export default function AppWalletCard(
  props: Readonly<{
    wallet: AppWallet;
  }>
) {
  return (
    <Link
      href={`/tools/app-wallets/${props.wallet.address}`}
      className="decoration-none">
      <Container className={styles.seedWalletCard}>
        <Row>
          <Col className="text-break d-flex align-items-center gap-2">
            <Image
              className={styles.seedWalletAvatar}
              fetchPriority="high"
              loading="eager"
              height={36}
              width={36}
              src={`https://robohash.org/${props.wallet.address}.png`}
              alt={props.wallet.address}
            />
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
