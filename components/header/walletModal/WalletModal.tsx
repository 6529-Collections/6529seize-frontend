import { Col, Container, Modal, Row } from "react-bootstrap";
import styles from "./WalletModal.module.scss";
import { disconnect } from "@wagmi/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { ENS } from "../../../entities/IENS";
import { fetchUrl } from "../../../services/6529api";
import {  numberWithCommas } from "../../../helpers/Helpers";
import Address from "../../address/Address";
import { AuthContext } from "../../auth/Auth";

interface Props {
  wallet: `0x${string}`;
  show: boolean;
  onHide: () => void;
}

export default function WalletModal(props: Props) {
  const { myProfile } = useContext(AuthContext);
  const [ens, setEns] = useState<ENS>();
  const [copied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    const getUser = async () => {
      if (!myProfile) {
        setEns(undefined);
      } else {
        const user = await fetchUrl(
          `${process.env.API_ENDPOINT}/api/user/${props.wallet}`
        ).catch(() => null);
        {
          const highestTdhWallet = myProfile?.consolidation?.wallets?.reduce(
            (prev, current) => (prev.tdh > current.tdh ? prev : current)
          );

          setEns({
            created_at: myProfile.profile?.created_at ?? undefined,
            wallet: props.wallet.toLowerCase(),
            display:
              myProfile.profile?.handle ??
              highestTdhWallet?.wallet?.ens ??
              props.wallet.toLowerCase(),
            consolidation_key: user.consolidation_key,
            pfp: myProfile.profile?.pfp_url ?? undefined,
            banner_1: myProfile.profile?.banner_1 ?? undefined,
            banner_2: myProfile.profile?.banner_2 ?? undefined,
            website: myProfile.profile?.website ?? undefined,
          });
        }
      }
    };

    getUser();
  }, [props.wallet, myProfile]);

  function copy() {
    navigator.clipboard.writeText(props.wallet);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  return (
    <Modal show={props.show} onHide={() => props.onHide()}>
      <Modal.Header className={styles.header}>
        <Modal.Title>
          <Image
            priority
            src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png"
            alt="Seize Logo"
            width={0}
            height={0}
            style={{ height: "28px", width: "auto" }}
          />
        </Modal.Title>
        <FontAwesomeIcon
          className={styles.walletModalClose}
          icon="times-circle"
          onClick={() => props.onHide()}
        />
      </Modal.Header>
      {ens && ens.pfp && ens.banner_1 && ens.banner_2 && (
        <div
          className={styles.banner}
          style={{
            background: `linear-gradient(45deg, ${ens.banner_1} 0%, ${ens.banner_2} 100%)`,
          }}
        >
          <Image
            src={ens.pfp}
            alt="Profile Picture"
            width={0}
            height={0}
            className={styles.pfp}
          />
        </div>
      )}
      <Modal.Body
        className={`${styles.body} d-flex align-items-center justify-content-between font-larger`}
      >
        <Address
          wallets={[props.wallet]}
          display={ens?.display}
          disableLink={true}
          hideCopy={true}
        />
        <span className="d-flex flex-column align-items-end font-smaller">
          {ens && ens.boosted_tdh && ens.boosted_tdh > 0 && (
            <span>TDH: {numberWithCommas(ens.boosted_tdh)}</span>
          )}
          {ens && ens.balance && ens.balance > 0 && (
            <span>Cards: {numberWithCommas(ens.balance)}</span>
          )}
        </span>
      </Modal.Body>
      <Modal.Footer className={styles.footer}>
        <Container>
          <Row className="d-flex justify-content-between">
            <Col
              xs={3}
              className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}
              onClick={() => copy()}
            >
              <span className={styles.footerBtn}>
                <FontAwesomeIcon className={styles.footerIcon} icon="copy" />
              </span>
              <span className="font-smaller no-wrap">
                <b>{copied ? `Copied` : `Copy Address`}</b>
              </span>
            </Col>
            {ens && (
              <>
                <Col
                  xs={3}
                  className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}
                  onClick={() => {
                    const newPath = ens?.display
                      ? `/${ens.display}`
                      : `/${props.wallet as string}`;
                    if (window.location.pathname !== newPath) {
                      window.location.href = newPath;
                    } else {
                      props.onHide();
                    }
                  }}
                >
                  <span className={styles.footerBtn}>
                    <FontAwesomeIcon
                      className={styles.footerIcon}
                      icon="user"
                    />
                  </span>
                  <span className="font-smaller no-wrap">
                    <b>View Profile</b>
                  </span>
                </Col>
                <Col
                  xs={3}
                  className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}
                  onClick={() => {
                    const newPath = ens?.display
                      ? `/${ens.display}/settings`
                      : `/${props.wallet as string}/settings`;
                    if (window.location.pathname !== newPath) {
                      window.location.href = newPath;
                    } else {
                      props.onHide();
                    }
                  }}
                >
                  <span className={styles.footerBtn}>
                    <FontAwesomeIcon
                      className={styles.footerIcon}
                      icon="gear"
                    />
                  </span>
                  <span className="font-smaller no-wrap">
                    <b>Edit Profile</b>
                  </span>
                </Col>
              </>
            )}
            <Col
              xs={3}
              className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}
              onClick={() => {
                disconnect();
                props.onHide();
              }}
            >
              <span className={styles.footerBtn}>
                <FontAwesomeIcon
                  className={styles.footerIcon}
                  icon="arrow-right-from-bracket"
                />
              </span>
              <span className="font-smaller no-wrap">
                <b>Disconnect</b>
              </span>
            </Col>
          </Row>
        </Container>
      </Modal.Footer>
    </Modal>
  );
}
