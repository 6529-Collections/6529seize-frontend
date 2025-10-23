"use client";

import Link from "next/link";
import { useSetTitle } from "@/contexts/TitleContext";
import { AboutSection } from "@/enums";
import styles from "@/styles/Home.module.scss";
import { Col, Container, Row } from "react-bootstrap";

export default function DisputeResolutionPage() {
  useSetTitle("Dispute Resolution | 6529.io");

  return (
    <main className={styles.main}>
      <Container>
        <Row className="pt-4 pb-4">
          <Col>
            <h1>
              Dispute Resolution
            </h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              Dispute resolution for disputes relating to the Terms shall occur
              through JAMS, an arbitration organization, under the terms noted
              below, which shall be considered part of the Terms.
            </p>
            <br />
            <ol>
              <li>
                Any dispute, claim or controversy arising out of or relating to
                this Agreement or the breach, termination, enforcement,
                interpretation or validity thereof, including the determination
                of the scope or applicability of this agreement to arbitrate,
                shall be determined by arbitration in Manhattan County before
                one arbitrator. The arbitration shall be administered by JAMS
                pursuant to JAMS' Streamlined Arbitration Rules and Procedures.
                Judgment on the Award may be entered in any court having
                jurisdiction. This clause shall not preclude parties from
                seeking provisional remedies in aid of arbitration from a court
                of appropriate jurisdiction.
              </li>
              <br />
              <li>
                The parties shall maintain the confidential nature of the
                arbitration proceeding and the Award, including the Hearing,
                except as may be necessary to prepare for or conduct the
                arbitration hearing on the merits, or except as may be necessary
                in connection with a court application for a preliminary remedy,
                a judicial challenge to an Award or its enforcement, or unless
                otherwise required by law or judicial decision.
              </li>
              <br />
              <li>
                This Agreement and the rights of the parties hereunder shall be
                governed by and construed in accordance with the laws of the
                State of New York, exclusive of conflict or choice of law rules.
                The parties acknowledge that this Agreement evidences a
                transaction involving interstate commerce. Notwithstanding the
                provision in the preceding paragraph with respect to applicable
                substantive law, any arbitration conducted pursuant to the terms
                of this Agreement shall be governed by the Federal Arbitration
                Act (9 U.S.C., Secs. 1-16).
              </li>
              <br />
              <li>
                In any arbitration arising out of or related to this Agreement,
                the arbitrator(s) shall award to the prevailing party, if any,
                the costs and attorneys' fees reasonably incurred by the
                prevailing party in connection with the arbitration. If the
                arbitrator(s) determine a party to be the prevailing party under
                circumstances where the prevailing party won on some but not all
                of the claims and counterclaims, the arbitrator(s) may award the
                prevailing party an appropriate percentage of the costs and
                attorneys' fees reasonably incurred by the prevailing party in
                connection with the arbitration.
              </li>
            </ol>
            <br />
            <p>
              <Link href={`/about/${AboutSection.TERMS_OF_SERVICE}`}>
                Back to Terms of Service
              </Link>{" "}
            </p>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
