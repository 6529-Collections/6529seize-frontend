"use client";

import { Col, Container, Row } from "react-bootstrap";
import { MEMES_CONTRACT, MEMES_MANIFOLD_PROXY_CONTRACT } from "../../constants";
import {
  useManifoldClaim,
  ManifoldClaim,
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../../hooks/useManifoldClaim";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis";
import MintCountdownBox, {
  MemePageMintBtn,
} from "../mintCountdownBox/MintCountdownBox";
import styles from "../mintCountdownBox/MintCountdownBox.module.scss";
import { useEffect } from "react";
import useCapacitor from "../../hooks/useCapacitor";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

export default function MemePageMintCountdown(
  props: Readonly<{
    nft_id: number;
    hide_mint_btn: boolean;
    setClaim?: (claim: ManifoldClaim) => void;
    is_full_width: boolean;
    show_only_if_active: boolean;
  }>
) {
  const manifoldClaim = useManifoldClaim(
    MEMES_CONTRACT,
    MEMES_MANIFOLD_PROXY_CONTRACT,
    MEMES_MANIFOLD_PROXY_ABI,
    props.nft_id
  );

  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();

  useEffect(() => {
    if (props.setClaim && manifoldClaim) {
      props.setClaim(manifoldClaim);
    }
  }, [manifoldClaim, props.setClaim]);

  // Return null if show_only_if_active is true and status isn't active
  if (props.show_only_if_active && manifoldClaim?.status !== ManifoldClaimStatus.ACTIVE) {
    return null;
  }

  // Show skeleton loading state
  if (!manifoldClaim) {
    return (
      <Container className="no-padding pb-3">
        <Row>
          <Col>
            <div className={`${styles.countdownContainer} ${styles.loadingState}`}>
              <Row>
                <Col sm={12} md={props.is_full_width ? 12 : 6} className="pt-2 pb-2">
                  <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
                  <div className={`${styles.skeletonText} ${styles.skeletonCountdown}`}></div>
                </Col>
                {!props.hide_mint_btn && (
                  <Col
                    className="pt-2 pb-2 d-flex align-items-center"
                    sm={12}
                    md={props.is_full_width ? 12 : 6}>
                    <div className={styles.skeletonButton}></div>
                  </Col>
                )}
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show ended/finalized states
  if (manifoldClaim.status === ManifoldClaimStatus.ENDED) {
    return (
      <Container className="no-padding pb-3">
        <Row>
          <Col>
            <div className={styles.countdownContainer}>
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                <h4 className="mb-3">Mint Phase Complete</h4>
                <p className="mb-1">This mint phase has ended.</p>
                <p className="mb-0">Thank you for participating!</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (manifoldClaim.isFinalized) {
    return (
      <Container className="no-padding pb-3">
        <Row>
          <Col>
            <div className={styles.countdownContainer}>
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                <h4 className="mb-3">✅ Mint Complete - Sold Out!</h4>
                <p className="mb-1">All NFTs have been successfully minted.</p>
                <p className="mb-0">Thank you for participating!</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  const getTitle = () => {
    const phaseName =
      manifoldClaim.phase === ManifoldPhase.ALLOWLIST && manifoldClaim.memePhase
        ? manifoldClaim.memePhase.name
        : manifoldClaim.phase;

    return manifoldClaim.status === ManifoldClaimStatus.UPCOMING
      ? `${phaseName} Starts In`
      : `${phaseName} Ends In`;
  };

  const getButtons = () => {
    const buttons: MemePageMintBtn[] = [];
    if (!isIos || country === "US") {
      buttons.push({
        label: "Mint",
        link: `/the-memes/mint`,
        target: "_self",
      });
    }
    return buttons;
  };

  const showAllowlistInfo = manifoldClaim.phase === ManifoldPhase.ALLOWLIST;
  
  return (
    <Container className="no-padding pb-3">
      <Row>
        <Col>
          <div style={{ position: "relative" }}>
            {showAllowlistInfo && (
              <>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  data-tooltip-id="allowlist-info"
                  data-tooltip-content="The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist."
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    fontSize: "18px",
                    cursor: "help",
                    color: "#6c757d",
                    zIndex: 10
                  }}
                />
                <Tooltip 
                  id="allowlist-info" 
                  place="left"
                  opacity={1}
                  style={{
                    backgroundColor: "#37373E",
                    color: "white",
                    padding: "10px 14px",
                    maxWidth: "250px",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                    borderRadius: "6px"
                  }}
                />
              </>
            )}
            <MintCountdownBox
              title={getTitle()}
              date={
                manifoldClaim.status === ManifoldClaimStatus.UPCOMING
                  ? manifoldClaim.startDate
                  : manifoldClaim.endDate
              }
              hide_mint_btn={props.hide_mint_btn}
              is_full_width={props.is_full_width}
              buttons={getButtons()}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
