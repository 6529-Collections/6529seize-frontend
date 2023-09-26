import { Modal } from "react-bootstrap";
import styles from "./WalletModal.module.scss";
import { disconnect } from "@wagmi/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ENS } from "../../../entities/IENS";
import { fetchUrl } from "../../../services/6529api";
import { isEmptyObject, numberWithCommas } from "../../../helpers/Helpers";
import Address from "../../address/Address";

interface Props {
  wallet: `0x${string}`;
  show: boolean;
  onHide: () => void;
}

export default function WalletModal(props: Props) {
  const [ens, setEns] = useState<ENS>();

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/user/${props.wallet}`;
    fetchUrl(url).then((response: ENS) => {
      if (!isEmptyObject(response)) {
        setEns(response);
      }
    });
  }, [props.wallet]);

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
          }}>
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
        className={`${styles.body} d-flex align-items-center justify-content-between font-larger`}>
        <Address
          wallets={[props.wallet]}
          display={ens?.display}
          disableLink={true}
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
      {ens ? (
        <Modal.Footer
          className={`${styles.footer} d-flex justify-content-between`}>
          <span
            className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}>
            <span
              className={styles.footerBtn}
              onClick={() =>
                (window.location.href = ens?.display
                  ? `/${ens.display}`
                  : `/${props.wallet as string}`)
              }>
              <FontAwesomeIcon className={styles.footerIcon} icon="user" />
            </span>
            <span className="font-smaller">
              <b>View Profile</b>
            </span>
          </span>
          <span
            className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}>
            <span
              className={styles.footerBtn}
              onClick={() =>
                (window.location.href = ens?.display
                  ? `/${ens.display}/settings`
                  : `/${props.wallet as string}/settings`)
              }>
              <FontAwesomeIcon className={styles.footerIcon} icon="gear" />
            </span>
            <span className="font-smaller">
              <b>Profile Settings</b>
            </span>
          </span>
          <span
            className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}>
            <span
              className={styles.footerBtn}
              onClick={() => {
                disconnect();
                props.onHide();
              }}>
              <FontAwesomeIcon
                className={styles.footerIcon}
                icon="arrow-right-from-bracket"
              />
            </span>
            <span className="font-smaller">
              <b>Disconnect</b>
            </span>
          </span>
        </Modal.Footer>
      ) : (
        <Modal.Footer className={`${styles.footer} d-flex justify-content-end`}>
          <span
            className={`${styles.footerBtnContainer} d-flex flex-column align-items-center gap-2`}>
            <span
              className={styles.footerBtn}
              onClick={() => {
                disconnect();
                props.onHide();
              }}>
              <FontAwesomeIcon
                className={styles.footerIcon}
                icon="arrow-right-from-bracket"
              />
            </span>
            <span className="font-smaller">
              <b>Disconnect</b>
            </span>
          </span>
        </Modal.Footer>
      )}
    </Modal>
  );
}
