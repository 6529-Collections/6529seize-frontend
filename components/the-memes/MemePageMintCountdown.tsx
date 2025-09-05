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

export default function MemePageMintCountdown(
  props: Readonly<{
    nft_id: number;
    hide_mint_btn?: boolean;
    setClaim?: (claim: ManifoldClaim) => void;
    is_full_width?: boolean;
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
                <p>Thank you for participating!</p>
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
                <p>Thank you for participating!</p>
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

  return (
    <Container className="no-padding pb-3">
      <Row>
        <Col>
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
            additional_elements={
              manifoldClaim.phase === ManifoldPhase.ALLOWLIST && (
                <span className="font-smaller pt-1">
                  * The timer above displays the current time remaining for a
                  specific phase of the drop. Please refer to the distribution
                  plan to check if you are in the allowlist.
                </span>
              )
            }
          />
        </Col>
      </Row>
    </Container>
  );
}
