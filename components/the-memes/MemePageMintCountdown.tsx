import { Col, Container, Row } from "react-bootstrap";
import {
  MEMES_CONTRACT,
  MEMES_MANIFOLD_PROXY_CONTRACT,
  MEMES_MINTING_HREF,
} from "../../constants";
import useManifoldClaim, {
  ManifoldClaim,
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../../hooks/useManifoldClaim";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis";
import MintCountdownBox from "../mintCountdownBox/MintCountdownBox";
import { useEffect } from "react";

export default function MemePageMintCountdown(
  props: Readonly<{
    nft_id: number;
    hide_mint_btn?: boolean;
    setClaim?: (claim: ManifoldClaim) => void;
  }>
) {
  const manifoldClaim = useManifoldClaim(
    MEMES_CONTRACT,
    MEMES_MANIFOLD_PROXY_CONTRACT,
    MEMES_MANIFOLD_PROXY_ABI,
    props.nft_id
  );

  useEffect(() => {
    if (props.setClaim && manifoldClaim) {
      props.setClaim(manifoldClaim);
    }
  }, [manifoldClaim, props.setClaim]);

  if (!manifoldClaim || manifoldClaim.status === ManifoldClaimStatus.EXPIRED) {
    return <></>;
  }

  return (
    <Container className="no-padding pb-3">
      <Row>
        <Col>
          <MintCountdownBox
            title={
              manifoldClaim.status === ManifoldClaimStatus.UPCOMING
                ? `${manifoldClaim.phase} Starts In`
                : `${manifoldClaim.phase} Ends In`
            }
            date={
              manifoldClaim.status === ManifoldClaimStatus.UPCOMING
                ? manifoldClaim.startDate
                : manifoldClaim.endDate
            }
            hide_mint_btn={props.hide_mint_btn}
            buttons={[
              {
                label: "Mint on Manifold",
                link: MEMES_MINTING_HREF,
                target: "_blank",
              },
              {
                label: (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    Mint on Seize{" "}
                    <span className="badge bg-white text-dark font-smaller">
                      beta
                    </span>
                  </span>
                ),
                link: `/the-memes/${props.nft_id}/mint`,
                target: "_self",
              },
            ]}
            additional_elements={
              manifoldClaim.phase === ManifoldPhase.PUBLIC && (
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
